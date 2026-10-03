import Constants from "expo-constants";
import { getSecureItem, setSecureItem } from "@/lib/secure-store";
import { Platform } from "react-native";

const KEY = "dispHuella";
const LICENCIA_KEY = "dispLicencia";

function randomHuella() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export function codigoDe(huella: string) {
  const raw = huella.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (raw.length < 8) return "----";
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export async function getDispositivo() {
  let huella = await getSecureItem(KEY);
  if (!huella) {
    huella = randomHuella();
    await setSecureItem(KEY, huella);
  }
  const nombre = [Constants.deviceName, Platform.OS].filter(Boolean).join(" · ") || Platform.OS;
  return {
    huella,
    codigo: codigoDe(huella),
    nombre: nombre.slice(0, 120),
    plataforma: Platform.OS,
  };
}

export async function dispositivoYaAutorizado() {
  return (await getSecureItem(LICENCIA_KEY)) === "1";
}

export async function marcarDispositivoAutorizado() {
  await setSecureItem(LICENCIA_KEY, "1");
}

export async function revocarDispositivoLocal() {
  await setSecureItem(LICENCIA_KEY, "0");
}
