import { fetchHistorialGps } from "@/features/trazos/api";
import { api } from "@/lib/api";
import { hoy } from "@/lib/fecha-lima";
import type { UsuarioItem } from "../types";
import type { UsuarioPunto } from "./types";

type UnknownRecord = Record<string, unknown>;

const VIVO_MS = 3 * 60 * 1000;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRows(payload: unknown, key: string): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    const nested = payload[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
  }
  return [];
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    const next = String(value).trim();
    if (next && next !== "null") return next;
  }
  return "";
}

function num(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
}

function parseAt(value: unknown) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function meter(
  out: Map<string, UsuarioPunto>,
  names: Map<string, UsuarioItem>,
  id: string,
  lat: number,
  lng: number,
  kmh: number,
  at: number,
  nombre: string,
) {
  const user = names.get(id);
  if (user && !user.activo) return;
  const prev = out.get(id);
  if (prev && prev.at >= at) return;
  out.set(id, {
    id,
    nombre: user?.nombre || nombre || "Usuario",
    rol: user?.rol || "usuario",
    lat,
    lng,
    kmh,
    at,
    vivo: at > 0 && Date.now() - at < VIVO_MS,
  });
}

export async function fetchPuntosUsuarios(usuarios: UsuarioItem[]): Promise<UsuarioPunto[]> {
  const names = new Map(usuarios.map((item) => [item.id, item]));
  const out = new Map<string, UsuarioPunto>();

  const [live, days] = await Promise.all([
    api<unknown>("/api/conductores/ubicaciones").catch(() => ({ ubicaciones: [] })),
    fetchHistorialGps({ fecha: hoy() }).catch(() => []),
  ]);

  for (const row of asRows(live, "ubicaciones")) {
    const id = text(row.usuario_id, row.usuarioId, row.id);
    const lat = num(row.latitude, row.latitud, row.lat);
    const lng = num(row.longitude, row.longitud, row.lng);
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    meter(
      out,
      names,
      id,
      lat,
      lng,
      Math.max(0, num(row.velocidad, row.speed, 0) || 0),
      parseAt(row.timestamp),
      text(row.nombre),
    );
  }

  for (const day of days) {
    const last = day.puntos[day.puntos.length - 1];
    if (!last || !day.resumen.usuarioId) continue;
    meter(
      out,
      names,
      day.resumen.usuarioId,
      last.lat,
      last.lng,
      last.kmh,
      last.at,
      day.resumen.usuarioNombre,
    );
  }

  return [...out.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
