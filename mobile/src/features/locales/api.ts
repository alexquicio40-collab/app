import { api, apiUpload, getApiBaseUrl } from "@/lib/api";
import type { LocalFormInput, LocalFoto, LocalItem, PendingLocalFoto } from "./types";

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

function text(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    const next = String(value).trim();
    if (next) return next;
  }
  return "";
}

function num(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function bool(value: unknown) {
  return value === 1 || value === true || value === "1";
}

function parseFrecuencias(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }
  const raw = text(value);
  if (!raw) return [];
  return raw.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function parseMetodos(value: unknown): { id: number; nombre: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { id: number; nombre: string }[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const id = num(row.id);
    const nombre = text(row.nombre);
    if (id == null || !nombre) continue;
    out.push({ id, nombre });
  }
  return out;
}

function resolveMediaPath(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function parseFotos(value: unknown, localId: string): LocalFoto[] {
  if (!Array.isArray(value)) return [];
  const out: LocalFoto[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const id = text(row.id);
    const ruta = text(row.ruta_archivo, row.rutaArchivo, row.url);
    if (!id || !ruta) continue;
    out.push({
      id,
      localId: text(row.local_id) || localId,
      rutaArchivo: resolveMediaPath(ruta),
      descripcion: text(row.descripcion),
      orden: num(row.orden) ?? out.length,
    });
  }
  return out.sort((a, b) => a.orden - b.orden);
}

export function parseLocal(row: UnknownRecord): LocalItem | null {
  const id = text(row.id);
  if (!id) return null;

  return {
    id,
    nombre: text(row.nombre) || `Local ${id}`,
    direccion: text(row.direccion),
    latitud: num(row.latitud, row.lat),
    longitud: num(row.longitud, row.lng),
    horarioEntrada: text(row.horario_entrada_proveedores),
    asesorBioClim: text(row.asesor_bio_clim),
    telefonoAsesor: text(row.telefono_asesor),
    encargadoNombre: text(row.encargado_tienda),
    encargadoTelefono: text(row.telefono_encargado),
    referencia: text(row.referencia),
    ruc: text(row.ruc),
    razonSocial: text(row.razon_social),
    necesitaCertificacion: bool(row.necesita_certificacion),
    estadoCertificacion: text(row.estado_certificacion) || null,
    archivoCertificado: text(row.archivo_certificado) || null,
    activo: row.activo == null ? true : bool(row.activo),
    tipoEnvase: text(row.tipo_envase),
    cantidadEnvases: num(row.cantidad_envases),
    cantidadBidonesAzules: num(row.cantidad_bidones_azules),
    cantidadBidonesBlancos: num(row.cantidad_bidones_blancos),
    bidonReal: num(row.bidon_real),
    bidonPasadoPor: num(row.bidon_pasado_por),
    frecuencias: parseFrecuencias(row.frecuencias_asignacion),
    metodosPago: parseMetodos(row.metodos_pago),
    fotos: parseFotos(row.fotos, id),
  };
}

function toBody(input: LocalFormInput) {
  return {
    nombre: input.nombre,
    direccion: input.direccion,
    latitud: input.latitud,
    longitud: input.longitud,
    horario_entrada_proveedores: input.horarioEntrada || null,
    asesor_bio_clim: input.asesorBioClim || null,
    telefono_asesor: input.telefonoAsesor || null,
    encargado_tienda: input.encargadoNombre || null,
    telefono_encargado: input.encargadoTelefono || null,
    referencia: input.referencia || null,
    ruc: input.ruc || null,
    razon_social: input.razonSocial || null,
    necesita_certificacion: input.necesitaCertificacion ? 1 : 0,
    estado_certificacion: input.necesitaCertificacion
      ? input.estadoCertificacion || "pendiente"
      : null,
    tipo_envase: input.tipoEnvase || null,
    cantidad_envases: input.cantidadEnvases ?? null,
    cantidad_bidones_azules: input.cantidadBidonesAzules ?? null,
    cantidad_bidones_blancos: input.cantidadBidonesBlancos ?? null,
    bidon_real: input.bidonReal ?? null,
    bidon_pasado_por: input.bidonPasadoPor ?? null,
    metodos_pago_ids: input.metodosPagoIds ?? [],
  };
}

export async function fetchLocales(): Promise<LocalItem[]> {
  const payload = await api<unknown>("/api/locales");
  return asRows(payload, "locales")
    .map(parseLocal)
    .filter((item): item is LocalItem => Boolean(item));
}

export async function createLocal(input: LocalFormInput) {
  return api<{ success?: boolean; local?: UnknownRecord; id?: number | string }>("/api/locales", {
    method: "POST",
    body: toBody(input),
  });
}

export async function updateLocal(id: string, input: LocalFormInput) {
  return api<{ success?: boolean }>(`/api/locales/${id}`, {
    method: "PUT",
    body: toBody(input),
  });
}

export function extractCreatedLocalId(
  result: { local?: UnknownRecord; id?: number | string },
): string {
  if (isRecord(result.local)) {
    const nested = text(result.local.id);
    if (nested) return nested;
  }
  return text(result.id);
}

export async function uploadFotoLocal(
  localId: string,
  foto: PendingLocalFoto,
  opts: { descripcion?: string; orden?: number } = {},
) {
  const form = new FormData();

  if (typeof Blob !== "undefined" && foto.uri.startsWith("blob:")) {
    const blob = await fetch(foto.uri).then((r) => r.blob());
    form.append("foto", blob, foto.name);
  } else if (typeof Blob !== "undefined" && foto.uri.startsWith("data:")) {
    const blob = await fetch(foto.uri).then((r) => r.blob());
    form.append("foto", blob, foto.name);
  } else {
    // React Native multipart file shape
    form.append("foto", {
      uri: foto.uri,
      name: foto.name,
      type: foto.mimeType || "image/jpeg",
    } as unknown as Blob);
  }

  if (opts.descripcion) form.append("descripcion", opts.descripcion);
  form.append("orden", String(opts.orden ?? 0));

  return apiUpload<unknown>(`/api/locales/${localId}/fotos/upload`, form);
}

export async function deleteFotoLocal(localId: string, fotoId: string) {
  return api<{ success?: boolean }>(`/api/locales/${localId}/fotos/${fotoId}`, {
    method: "DELETE",
  });
}

export async function syncLocalFotos(
  localId: string,
  pending: PendingLocalFoto[],
  removedIds: string[],
) {
  for (const fotoId of removedIds) {
    try {
      await deleteFotoLocal(localId, fotoId);
    } catch {
      // Continuar aunque falle una eliminación
    }
  }

  for (let i = 0; i < pending.length; i += 1) {
    try {
      await uploadFotoLocal(localId, pending[i], {
        descripcion: `Foto de entrada ${i + 1}`,
        orden: i,
      });
    } catch {
      // Continuar aunque falle una subida (mismo criterio que Flutter)
    }
  }
}

export async function updateLocalCertEstado(id: string, estado: string) {
  return api<{ success?: boolean }>(`/api/locales/${id}`, {
    method: "PUT",
    body: { estado_certificacion: estado },
  });
}

export async function deleteLocal(id: string) {
  return api<{ success?: boolean }>(`/api/locales/${id}`, {
    method: "DELETE",
  });
}

export type MetodoPagoOption = { id: number; nombre: string; activo: boolean };

export async function fetchMetodosPago(): Promise<MetodoPagoOption[]> {
  const payload = await api<unknown>("/api/metodos-pago").catch(() => ({ metodos_pago: [] }));
  return asRows(payload, "metodos_pago")
    .map((row) => {
      const id = num(row.id);
      const nombre = text(row.nombre);
      if (id == null || !nombre) return null;
      return {
        id,
        nombre,
        activo: row.activo == null ? true : bool(row.activo),
      };
    })
    .filter((item): item is MetodoPagoOption => Boolean(item))
    .filter((item) => item.activo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function createMetodoPago(nombre: string): Promise<MetodoPagoOption> {
  const trimmed = nombre.trim();
  if (!trimmed) throw new Error("El nombre es obligatorio");
  if (trimmed.length > 60) throw new Error("Máximo 60 caracteres");
  const payload = await api<UnknownRecord>("/api/metodos-pago", {
    method: "POST",
    body: { nombre: trimmed },
  });
  const id = num(payload.id);
  if (id == null) throw new Error("No se pudo crear el método de pago");
  return {
    id,
    nombre: text(payload.nombre) || trimmed,
    activo: true,
  };
}

export async function updateMetodoPago(
  id: number,
  input: { nombre?: string; activo?: boolean },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (input.nombre != null) {
    const trimmed = input.nombre.trim();
    if (!trimmed) throw new Error("El nombre es obligatorio");
    if (trimmed.length > 60) throw new Error("Máximo 60 caracteres");
    body.nombre = trimmed;
  }
  if (input.activo != null) body.activo = input.activo ? 1 : 0;
  await api(`/api/metodos-pago/${id}`, { method: "PUT", body });
}

export async function deleteMetodoPago(id: number): Promise<void> {
  await api(`/api/metodos-pago/${id}`, { method: "DELETE" });
}
