import { emitirUbicacion } from "@/features/gps-fondo/canal";
import { getApiBaseUrl } from "@/lib/api";
import { getAccessToken, getSessionToken } from "@/lib/secure-store";
import { emitSessionClosed } from "@/lib/session-bus";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const CADA_MS = 2000;
const CADA_METROS = 12;
const FILE = "gps-sesion.json";

let ultimoEnvio = 0;
let ultimoPunto: { lat: number; lng: number } | null = null;
let pendiente: { userId: string; lat: number; lng: number; speed: number } | null = null;
let enviando = false;

export async function saveGpsUser(userId: string) {
  const payload = JSON.stringify({ userId });
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem("bioclim-gps-user", userId);
    return;
  }
  const root = FileSystem.documentDirectory;
  if (!root) return;
  await FileSystem.writeAsStringAsync(`${root}${FILE}`, payload);
}

export async function clearGpsUser() {
  ultimoEnvio = 0;
  ultimoPunto = null;
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem("bioclim-gps-user");
    return;
  }
  const root = FileSystem.documentDirectory;
  if (!root) return;
  await FileSystem.deleteAsync(`${root}${FILE}`, { idempotent: true });
}

async function readGpsUser() {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem("bioclim-gps-user") ?? "";
  const root = FileSystem.documentDirectory;
  if (!root) return "";
  try {
    return JSON.parse(await FileSystem.readAsStringAsync(`${root}${FILE}`)).userId as string;
  } catch {
    return "";
  }
}

function metros(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const lat = (b.lat - a.lat) * 111_320;
  const lng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(lat, lng);
}

function tocaEnviar(lat: number, lng: number) {
  if (!ultimoPunto) return true;
  if (Date.now() - ultimoEnvio >= CADA_MS) return true;
  return metros(ultimoPunto, { lat, lng }) >= CADA_METROS;
}

/** Publica un punto al mapa en vivo y lo guarda en el servidor. */
export async function publishFix(lat: number, lng: number, speed: number) {
  const stored = await readGpsUser();
  let token = "";
  if (!stored) {
    try {
      token = (await getAccessToken()) ?? "";
    } catch {
      token = "";
    }
  }
  const userId = stored || token;
  if (!userId || !tocaEnviar(lat, lng)) return;
  const velocidad = Math.max(0, speed || 0);
  ultimoEnvio = Date.now();
  ultimoPunto = { lat, lng };
  emitirUbicacion(userId, lat, lng, velocidad);
  pendiente = { userId, lat, lng, speed: velocidad };
  void drenar();
}

async function drenar() {
  if (enviando || !pendiente) return;
  enviando = true;
  const punto = pendiente;
  pendiente = null;
  await guardar(punto.userId, punto.lat, punto.lng, punto.speed);
  enviando = false;
  if (pendiente) void drenar();
}

async function guardar(userId: string, lat: number, lng: number, speed: number) {
  const body = JSON.stringify({
    usuario_id: Number(userId),
    latitud: lat,
    longitud: lng,
    velocidad: speed,
    estado: "activo",
  });
  const sessionToken = await getSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": userId,
  };
  if (sessionToken) headers["X-Session-Token"] = sessionToken;
  const base = getApiBaseUrl();
  for (const path of ["/api/ubicaciones", "/api/conductores/ubicacion"]) {
    try {
      const response = await fetch(`${base}${path}`, {
        method: "POST",
        headers,
        credentials: "include",
        body,
      });
      if (response.ok) return;
      const payload = (await response.json().catch(() => ({}))) as { code?: string };
      if (payload.code === "SESSION_CLOSED") {
        emitSessionClosed();
        return;
      }
    } catch {
      continue;
    }
  }
}
