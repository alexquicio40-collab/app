import { api, apiUpload, getApiBaseUrl } from "@/lib/api";
import { createListStore, fetchLive, mapRows } from "@/lib/fast-data";
import type {
  ComprobantePago,
  ComprobanteUploadInput,
  HojaPago,
  PagosFilters,
  PendingComprobanteFile,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function text(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const d = value;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
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

function resolveMedia(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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

export function parseComprobante(row: UnknownRecord): ComprobantePago | null {
  const id = text(row.id);
  const ruta = text(row.ruta_archivo, row.rutaArchivo);
  if (!id || !ruta) return null;
  return {
    id,
    rutaArchivo: ruta,
    archivoUrl: resolveMedia(ruta) || ruta,
    descripcion: text(row.descripcion),
    createdBy: text(row.created_by) || null,
    creadoPorNombre: text(row.creado_por_nombre, row.creadoPorNombre),
    createdAt: text(row.created_at) || null,
  };
}

function parseLocales(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const name = text(item);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function parseHojaPago(row: UnknownRecord): HojaPago | null {
  const id = text(row.id);
  if (!id) return null;
  const comps = asRows(row.comprobantes).map(parseComprobante).filter(Boolean);
  return {
    id,
    conductorId: text(row.conductor_id) || "",
    conductorNombre: text(row.conductor_nombre) || "Sin conductor",
    operadorAcompanante: text(row.operador_acompanante),
    placa: text(row.placa),
    fecha: text(row.fecha) || null,
    caja: num(row.caja),
    totalGalones: num(row.total_galones),
    totalBaldes: num(row.total_baldes),
    totalLitros: num(row.total_litros),
    totalGastos: num(row.total_gastos),
    totalGeneral: num(row.total_general),
    vuelto: num(row.vuelto),
    createdAt: text(row.created_at) || null,
    comprobantesCount: num(row.comprobantes_count) || comps.length,
    localesNombres: parseLocales(row.locales_nombres),
  };
}

async function appendFile(form: FormData, field: string, file: PendingComprobanteFile) {
  if (file.uri.startsWith("blob:") || file.uri.startsWith("data:")) {
    const blob = await fetch(file.uri).then((r) => r.blob());
    form.append(field, blob, file.name);
    return;
  }
  form.append(field, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/octet-stream",
  } as unknown as Blob);
}

function hojasStore(filters: Pick<PagosFilters, "fechaDesde" | "fechaHasta">) {
  return createListStore<HojaPago>(
    `pagos-hojas:${qs({
      desde: filters.fechaDesde,
      hasta: filters.fechaHasta,
    })}`,
  );
}

export function peekHojasFinalizadas(filters: Pick<PagosFilters, "fechaDesde" | "fechaHasta">) {
  return hojasStore(filters).peek();
}

export async function fetchHojasFinalizadas(
  filters: Pick<PagosFilters, "fechaDesde" | "fechaHasta">,
  opts?: { force?: boolean; onPartial?: (items: HojaPago[]) => void },
): Promise<HojaPago[]> {
  const store = hojasStore(filters);
  if (!opts?.force && store.fresh()) {
    const cached = store.peek();
    if (cached) {
      opts?.onPartial?.(cached);
      return cached;
    }
  }
  const payload = await fetchLive<unknown>(
    `/api/pagos/hojas-finalizadas${qs({
      desde: filters.fechaDesde,
      hasta: filters.fechaHasta,
    })}`,
  );
  const items = await mapRows(asRows(payload, "hojas"), parseHojaPago, {
    onPartial: opts?.onPartial,
  });
  store.remember(items);
  return items;
}

export async function fetchComprobantes(hojaId: string): Promise<ComprobantePago[]> {
  const payload = await fetchLive<unknown>(`/api/hojas-ruta/${hojaId}/comprobantes`);
  return asRows(payload, "comprobantes")
    .map(parseComprobante)
    .filter((item): item is ComprobantePago => Boolean(item));
}

export async function uploadComprobante(hojaId: string, input: ComprobanteUploadInput) {
  const form = new FormData();
  await appendFile(form, "comprobante", input.file);
  if (input.descripcion.trim()) {
    form.append("descripcion", input.descripcion.trim().slice(0, 500));
  }
  return apiUpload<unknown>(`/api/hojas-ruta/${hojaId}/comprobantes`, form, { method: "POST" });
}

export async function deleteComprobante(hojaId: string, compId: string) {
  return api<{ success?: boolean }>(`/api/hojas-ruta/${hojaId}/comprobantes/${compId}`, {
    method: "DELETE",
  });
}
