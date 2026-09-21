import { api, apiUpload, getApiBaseUrl } from "@/lib/api";
import type {
  CertificadoHistorial,
  CertificadoPendiente,
  CertUploadInput,
  HistorialFilters,
  PendientesFilters,
  PendingCertFile,
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
    if (Number.isFinite(parsed)) return Math.round(parsed);
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

export function parsePendiente(row: UnknownRecord): CertificadoPendiente | null {
  const id = text(row.id);
  if (!id) return null;
  return {
    id,
    nombre: text(row.nombre) || "Sin nombre",
    direccion: text(row.direccion),
    ruc: text(row.ruc),
    razonSocial: text(row.razon_social),
    encargadoTienda: text(row.encargado_tienda),
    telefonoEncargado: text(row.telefono_encargado),
    asesorBioClim: text(row.asesor_bio_clim),
    telefonoAsesor: text(row.telefono_asesor),
    tipoEnvase: text(row.tipo_envase),
    cantidadEnvases: num(row.cantidad_envases),
    cantidadBidonesAzules: num(row.cantidad_bidones_azules),
    cantidadBidonesBlancos: num(row.cantidad_bidones_blancos),
    estadoCertificacion: text(row.estado_certificacion) || null,
    archivoCertificado: resolveMedia(text(row.archivo_certificado) || null),
    ultimaRutaCompletada: text(row.ultima_ruta_completada) || null,
    ultimaRutaId: text(row.ultima_ruta_id) || null,
  };
}

export function parseHistorial(row: UnknownRecord): CertificadoHistorial | null {
  const id = text(row.id);
  const archivo = text(row.archivo);
  if (!id || !archivo) return null;
  return {
    id,
    localId: text(row.local_id) || null,
    rutaAsignadaId: text(row.ruta_asignada_id) || null,
    archivo,
    archivoUrl: resolveMedia(archivo) || archivo,
    tipoArchivo: text(row.tipo_archivo),
    observaciones: text(row.observaciones),
    usuarioId: text(row.usuario_id) || null,
    usuarioNombre: text(row.usuario_nombre),
    createdAt: text(row.created_at) || null,
    localNombre: text(row.local_nombre) || "Local",
    localDireccion: text(row.local_direccion),
    localRuc: text(row.local_ruc),
    localRazonSocial: text(row.local_razon_social),
    rutaFecha: text(row.ruta_fecha) || null,
    rutaFechaCompletada: text(row.ruta_fecha_completada) || null,
    conductorNombre: text(row.conductor_nombre),
  };
}

async function appendFile(form: FormData, field: string, file: PendingCertFile) {
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

export async function fetchPendientes(
  filters: PendientesFilters,
): Promise<CertificadoPendiente[]> {
  const payload = await api<unknown>(
    `/api/certificados/pendientes${qs({
      q: filters.search || undefined,
      asesor: filters.asesor,
      fecha_desde: filters.fechaDesde,
      fecha_hasta: filters.fechaHasta,
    })}`,
  );
  return asRows(payload, "locales")
    .map(parsePendiente)
    .filter((item): item is CertificadoPendiente => Boolean(item));
}

export async function fetchHistorial(
  filters: Pick<HistorialFilters, "fechaDesde" | "fechaHasta">,
): Promise<CertificadoHistorial[]> {
  const payload = await api<unknown>(
    `/api/certificados/historial${qs({
      fecha_desde: filters.fechaDesde,
      fecha_hasta: filters.fechaHasta,
    })}`,
  );
  return asRows(payload, "historial")
    .map(parseHistorial)
    .filter((item): item is CertificadoHistorial => Boolean(item));
}

export async function uploadCertificado(localId: string, input: CertUploadInput) {
  const form = new FormData();
  await appendFile(form, "certificado", input.file);
  if (input.observaciones.trim()) {
    form.append("observaciones", input.observaciones.trim().slice(0, 2000));
  }
  if (input.rutaAsignadaId) {
    form.append("ruta_asignada_id", input.rutaAsignadaId);
  }
  return apiUpload<unknown>(`/api/certificados/${localId}/upload`, form, { method: "POST" });
}

export async function deleteHistorialItem(id: string) {
  return api<{ success?: boolean }>(`/api/certificados/historial/${id}`, { method: "DELETE" });
}

export async function fetchAsesoresFromPendientes(rows: CertificadoPendiente[]) {
  const map = new Map<string, string>();
  for (const row of rows) {
    const name = row.asesorBioClim.trim();
    if (!name) continue;
    map.set(name.toLowerCase(), name);
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, "es"));
}
