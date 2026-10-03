import { api } from "@/lib/api";
import { dia } from "@/lib/fecha-lima";
import type { GpsPunto, HistorialResumen } from "./types";
import { aKmh } from "./lib/geo";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    const next = String(value).trim();
    if (next && next !== "null" && next !== "undefined") return next;
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

export function parsePunto(row: UnknownRecord): GpsPunto | null {
  const lat = num(row.latitude, row.latitud, row.lat);
  const lng = num(row.longitude, row.longitud, row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const velocidad = num(row.velocidad, row.speed, 0) || 0;
  const at = parseAt(row.timestamp);
  if (!at) return null;
  return { lat, lng, velocidad, kmh: aKmh(velocidad), at };
}

export async function fetchHistorialGps(opts: {
  fecha: string;
  conductorId?: string | null;
}): Promise<{ resumen: HistorialResumen; puntos: GpsPunto[] }[]> {
  const params = new URLSearchParams();
  params.set("fecha", opts.fecha);
  if (opts.conductorId) params.set("conductor_id", opts.conductorId);
  const payload = await api<{ success?: boolean; historial?: unknown }>(
    `/api/historial?${params.toString()}`,
  );
  const rows = Array.isArray(payload.historial) ? payload.historial.filter(isRecord) : [];
  return rows
    .map((row) => {
      const usuarioId = text(row.usuario_id, row.usuarioId) || opts.conductorId || "";
      const rawPuntos = Array.isArray(row.puntos) ? row.puntos.filter(isRecord) : [];
      const puntos = rawPuntos
        .map(parsePunto)
        .filter((item): item is GpsPunto => Boolean(item))
        .sort((a, b) => a.at - b.at);
      return {
        resumen: {
          usuarioId,
          usuarioNombre: text(row.usuario_nombre, row.usuarioNombre) || "Operador",
          fecha: dia(text(row.fecha) || opts.fecha),
          puntos: puntos.length || num(row.puntos) || 0,
        },
        puntos,
      };
    })
    .filter((item) => item.puntos.length > 0);
}
