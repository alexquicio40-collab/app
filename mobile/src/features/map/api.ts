import { api, limaDate } from "@/lib/api";
import { ONLINE_MS } from "./constants";
import type { LiveOperator, LiveStop, MapLive, OperatorCatalogItem } from "./types";

type UnknownRecord = Record<string, unknown>;

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

function num(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
}

function rowId(row: UnknownRecord) {
  return num(row.usuario_id, row.userId, row.conductor_id, row.id);
}

function rowName(row: UnknownRecord, fallback = "Operador") {
  const name = row.nombre ?? row.userName ?? row.conductor_nombre ?? row.name;
  const text = String(name ?? "").trim();
  return text || fallback;
}

function toIso(value: unknown) {
  if (value == null || value === "") return new Date().toISOString();
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 1e12 ? value * 1000 : value;
    return new Date(millis).toISOString();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function isFresh(timestamp: string) {
  const age = Date.now() - new Date(timestamp).getTime();
  return Number.isFinite(age) && age >= 0 && age < ONLINE_MS;
}

function parseOperator(row: UnknownRecord, names: Map<number, string>): LiveOperator | null {
  const id = rowId(row);
  const latitude = num(row.latitude, row.latitud, row.lat);
  const longitude = num(row.longitude, row.longitud, row.lng);
  const estado = String(row.estado ?? "").toLowerCase();

  if (!Number.isFinite(id) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (estado === "inactivo") return null;

  const timestamp = toIso(row.timestamp ?? row.ultimaActualizacion);
  if (!isFresh(timestamp)) return null;

  return {
    id,
    name: names.get(id) || rowName(row),
    latitude,
    longitude,
    speed: num(row.velocidad, row.speed, 0) || 0,
    timestamp,
    estado: estado === "activo" ? "activo" : "en_linea",
  };
}

function parseStop(row: UnknownRecord): LiveStop | null {
  const id = num(row.id);
  const operatorId = num(row.conductor_id, row.usuario_id, row.operatorId);
  const latitude = num(row.latitud, row.latitude, row.lat);
  const longitude = num(row.longitud, row.longitude, row.lng);
  const estado = String(row.estado ?? "pendiente");

  if (!Number.isFinite(id) || !Number.isFinite(operatorId)) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (!["programado", "en_ruta", "llego", "pendiente", "en_proceso"].includes(estado)) return null;

  return {
    id,
    operatorId,
    operatorName: rowName(row, "Operador"),
    localName: String(row.local_nombre ?? row.nombre ?? "Local"),
    latitude,
    longitude,
    estado,
  };
}

/** Snapshot HTTP (polling de respaldo, igual que la app Flutter). */
export async function mapLiveRequest(): Promise<MapLive> {
  const fecha = limaDate();
  const [conductoresPayload, livePayload, rutasPayload] = await Promise.all([
    api<unknown>("/api/conductores").catch(() => ({ conductores: [] })),
    api<unknown>("/api/conductores/ubicaciones"),
    api<unknown>(`/api/rutas?fecha=${fecha}`).catch(() => ({ rutas: [] })),
  ]);

  const catalogRows = asRows(conductoresPayload, "conductores");
  const locationRows = asRows(livePayload, "ubicaciones");
  const routeRows = asRows(rutasPayload, "rutas");

  const catalog: OperatorCatalogItem[] = [];
  const names = new Map<number, string>();

  for (const row of catalogRows) {
    const id = rowId(row);
    if (!Number.isFinite(id)) continue;
    const name = rowName(row);
    names.set(id, name);
    catalog.push({ id, name });
  }

  const operators = new Map<number, LiveOperator>();
  for (const row of locationRows) {
    const parsed = parseOperator(row, names);
    if (parsed) operators.set(parsed.id, parsed);
  }

  return {
    operators: [...operators.values()],
    stops: routeRows.map(parseStop).filter((item): item is LiveStop => Boolean(item)),
    catalog,
  };
}
