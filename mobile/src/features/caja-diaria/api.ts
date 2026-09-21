import { api } from "@/lib/api";
import type { CajaDiariaMap, CajaDiariaRow } from "./types";

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
  return 0;
}

function asRows(payload: unknown, key: string): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    const nested = payload[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
  }
  return [];
}

function parseRow(row: UnknownRecord): CajaDiariaRow | null {
  const conductorId = text(row.conductor_id, row.conductorId);
  if (!conductorId) return null;
  return {
    id: text(row.id) || conductorId,
    conductorId,
    fecha: text(row.fecha).slice(0, 10),
    monto: num(row.monto),
    updatedAt: text(row.updated_at) || null,
  };
}

/** Lista cajas del día (admin: todas; operador: solo la propia). */
export async function fetchCajaDiaria(fecha: string): Promise<CajaDiariaRow[]> {
  const payload = await api<unknown>(
    `/api/caja-diaria?fecha=${encodeURIComponent(fecha)}`,
  );
  return asRows(payload, "cajas")
    .map(parseRow)
    .filter((item): item is CajaDiariaRow => Boolean(item));
}

export async function fetchCajaDiariaMap(fecha: string): Promise<CajaDiariaMap> {
  const rows = await fetchCajaDiaria(fecha);
  const map: CajaDiariaMap = {};
  for (const row of rows) map[row.conductorId] = row;
  return map;
}

/** Monto propio del día (precarga hoja de ruta). */
export async function fetchCajaDelDia(fecha: string): Promise<number> {
  const rows = await fetchCajaDiaria(fecha).catch(() => []);
  if (!rows.length) return 0;
  return rows[0].monto;
}

export async function setCajaDiaria(input: {
  conductorId: string | number;
  fecha: string;
  monto: number;
}): Promise<void> {
  await api("/api/caja-diaria", {
    method: "POST",
    body: {
      conductor_id: input.conductorId,
      fecha: input.fecha,
      monto: input.monto,
    },
  });
}

export async function deleteCajaDiaria(input: {
  conductorId: string | number;
  fecha: string;
}): Promise<void> {
  await api("/api/caja-diaria", {
    method: "DELETE",
    body: {
      conductor_id: input.conductorId,
      fecha: input.fecha,
    },
  });
}
