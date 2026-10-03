import { fetchLocalesLite } from "@/features/locales/api";
import { api } from "@/lib/api";
import { dia } from "@/lib/fecha-lima";
import type {
  CreateHojaRutaInput,
  HistorialFilters,
  HojaHistorialDetail,
  HojaHistorialItem,
  HojaRutaFilaData,
  HojaRutaGastoData,
  HojaRutaPayloadData,
  LocalOption,
} from "./types";

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

function asRows(payload: unknown, ...keys: string[]): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) return nested.filter(isRecord);
    }
  }
  return [];
}

function qs(params: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || !String(value).trim()) continue;
    search.set(key, String(value).trim());
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

function parseResumen(row: UnknownRecord): HojaHistorialItem | null {
  const id = text(row.id);
  if (!id) return null;
  const fechaRaw = text(row.fecha);
  return {
    id,
    conductorId: text(row.conductor_id),
    conductorNombre: text(row.conductor_nombre) || "Sin conductor",
    operadorAcompanante: text(row.operador_acompanante),
    placa: text(row.placa),
    fecha: fechaRaw ? fechaRaw.slice(0, 10) : null,
    caja: num(row.caja),
    totalGalones: num(row.total_galones),
    totalBaldes: num(row.total_baldes),
    totalLitros: num(row.total_litros),
    totalGastos: num(row.total_gastos),
    totalGeneral: num(row.total_general),
    vuelto: num(row.vuelto),
    createdAt: text(row.created_at) || null,
  };
}

function parseFilaData(row: UnknownRecord): HojaRutaFilaData {
  return {
    localNombre: text(row.localNombre, row.local_nombre),
    localDireccion: text(row.localDireccion, row.local_direccion),
    galones: num(row.galones),
    galonesPrecio: num(row.galonesPrecio, row.galones_precio),
    baldes: num(row.baldes),
    baldesPrecio: num(row.baldesPrecio, row.baldes_precio),
    litros: num(row.litros),
    litrosPrecio: num(row.litrosPrecio, row.litros_precio),
  };
}

function parseGastoData(row: UnknownRecord): HojaRutaGastoData {
  return {
    descripcion: text(row.descripcion),
    monto: num(row.monto),
  };
}

function parsePayloadData(raw: unknown): HojaRutaPayloadData | null {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isRecord(data)) return null;
  const filas = Array.isArray(data.filas) ? data.filas.filter(isRecord).map(parseFilaData) : [];
  const gastos = Array.isArray(data.gastos) ? data.gastos.filter(isRecord).map(parseGastoData) : [];
  return {
    chofer: text(data.chofer),
    operadorAcompanante: text(data.operadorAcompanante, data.operador_acompanante),
    placa: text(data.placa),
    fecha: dia(text(data.fecha)),
    caja: num(data.caja),
    filas,
    gastos,
  };
}

/** Activos only + cache compartida con Asignar / otras pantallas. */
export async function fetchLocalesActivos(opts?: { force?: boolean }): Promise<LocalOption[]> {
  return fetchLocalesLite({ force: opts?.force, onlyActivos: true });
}

export async function fetchUserPlaca(userId: number | string): Promise<string> {
  const payload = await api<unknown>(`/api/users/${userId}`).catch(() => null);
  if (!isRecord(payload)) return "";
  const nested = payload.usuario ?? payload.user ?? payload.data ?? payload;
  if (!isRecord(nested)) return "";
  return text(nested.placa);
}

export { fetchCajaDelDia } from "@/features/caja-diaria/api";

export async function createHojaRuta(input: CreateHojaRutaInput): Promise<{ id: string }> {
  const payload = await api<{ id?: number | string; success?: boolean }>("/api/hojas-ruta", {
    method: "POST",
    body: {
      operador_acompanante: input.operadorAcompanante,
      placa: input.placa,
      fecha: input.fecha,
      caja: input.caja,
      total_galones: input.totalGalones,
      total_baldes: input.totalBaldes,
      total_litros: input.totalLitros,
      total_gastos: input.totalGastos,
      total_general: input.totalGeneral,
      vuelto: input.vuelto,
      data: input.data,
    },
  });
  return { id: String(payload.id ?? "") };
}

/** Lista historial. Admin/asesor: todas (+ filtro conductor). Operador: solo propias (API). */
export async function fetchHojasRuta(filters: HistorialFilters): Promise<HojaHistorialItem[]> {
  const payload = await api<unknown>(
    `/api/hojas-ruta${qs({
      fecha_desde: filters.fechaDesde,
      fecha_hasta: filters.fechaHasta,
      conductor_id: filters.conductorId,
    })}`,
  );
  return asRows(payload, "hojas")
    .map(parseResumen)
    .filter((item): item is HojaHistorialItem => Boolean(item));
}

export async function fetchHojaRutaById(id: string): Promise<HojaHistorialDetail> {
  const payload = await api<unknown>(`/api/hojas-ruta/${id}`);
  const row =
    isRecord(payload) && isRecord(payload.hoja)
      ? payload.hoja
      : isRecord(payload)
        ? payload
        : null;
  if (!row) throw new Error("No se pudo obtener el detalle");
  const resumen = parseResumen(row);
  if (!resumen) throw new Error("Hoja no encontrada");
  return {
    ...resumen,
    data: parsePayloadData(row.data),
  };
}

export async function deleteHojaRuta(id: string): Promise<void> {
  await api(`/api/hojas-ruta/${id}`, { method: "DELETE" });
}
