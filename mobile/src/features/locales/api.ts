import { api, apiUpload, getApiBaseUrl } from "@/lib/api";
import { parseMoney } from "./lib/precios";
import { normalizePrioridad } from "./lib/prioridad";
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

function firstFotoUrl(value: unknown): string | null {
  if (!Array.isArray(value) || !value.length) return null;
  const row = value[0];
  if (!isRecord(row)) return null;
  const ruta = text(row.ruta_archivo, row.rutaArchivo, row.url);
  return ruta ? resolveMediaPath(ruta) : null;
}

export function parseLocal(
  row: UnknownRecord,
  opts?: { includeFotos?: boolean },
): LocalItem | null {
  const id = text(row.id);
  if (!id) return null;
  const includeFotos = opts?.includeFotos === true;
  const portada = includeFotos ? null : firstFotoUrl(row.fotos);

  return {
    id,
    nombre: text(row.nombre) || `Local ${id}`,
    direccion: text(row.direccion),
    direccionCert: text(row.direccion_cert),
    direccionFiscal: text(row.direccion_fiscal, row.direccionFiscal),
    direccionComercial: text(row.direccion_comercial, row.direccionComercial),
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
    precioLitro: parseMoney(row.precio_litro ?? row.precioLitro),
    precioBalde: parseMoney(row.precio_balde ?? row.precioBalde),
    precioGalonera: parseMoney(row.precio_galonera ?? row.precioGalonera),
    operadoresVenPrecio: bool(row.operadores_ven_precio ?? row.operadoresVenPrecio),
    frecuencias: parseFrecuencias(row.frecuencias_asignacion),
    metodosPago: parseMetodos(row.metodos_pago),
    fotos: includeFotos
      ? parseFotos(row.fotos, id)
      : portada
        ? [{ id: `${id}-portada`, localId: id, rutaArchivo: portada, descripcion: "", orden: 0 }]
        : [],
    prioridad: normalizePrioridad(text(row.prioridad)),
    restringido: bool(row.restringido ?? row.local_restringido),
    createdAt: text(row.created_at, row.createdAt) || null,
  };
}

function toBody(input: LocalFormInput) {
  return {
    nombre: input.nombre,
    direccion: input.direccion,
    direccion_cert: input.direccionCert || null,
    direccion_fiscal: input.direccionFiscal || null,
    direccion_comercial: input.direccionComercial || null,
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
    precio_litro: input.precioLitro ?? null,
    precio_balde: input.precioBalde ?? null,
    precio_galonera: input.precioGalonera ?? null,
    operadores_ven_precio: input.operadoresVenPrecio ? 1 : 0,
    metodos_pago_ids: input.metodosPagoIds ?? [],
    prioridad: normalizePrioridad(input.prioridad),
    restringido: input.restringido ? 1 : 0,
  };
}

/** Listado ya parseado (para pintar la pantalla al toque). */
export function peekLocalesCache(): LocalItem[] | null {
  return localesListCache?.items ?? null;
}

export async function fetchLocales(opts?: {
  force?: boolean;
  /** Por defecto false: listado/mapa sin parsear el álbum de fotos. */
  includeFotos?: boolean;
}): Promise<LocalItem[]> {
  const includeFotos = opts?.includeFotos === true;
  if (
    !includeFotos &&
    !opts?.force &&
    localesListCache &&
    Date.now() - localesListCache.at < LOCALES_LIST_CACHE_MS
  ) {
    return localesListCache.items;
  }

  const payload = await api<unknown>("/api/locales");
  const raw = new Map<string, UnknownRecord>();
  const items: LocalItem[] = [];
  for (const row of asRows(payload, "locales")) {
    const item = parseLocal(row, { includeFotos });
    if (!item) continue;
    raw.set(item.id, row);
    items.push(item);
  }

  rawLocalesById = raw;
  if (!includeFotos) {
    localesListCache = { at: Date.now(), items };
  } else {
    localesListCache = null;
  }
  // Calienta el cache lite (Asignar / Hoja ruta) con el mismo payload.
  localesLiteCache = {
    at: Date.now(),
    items: items.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      direccion: item.direccion,
      asesorBioClim: item.asesorBioClim,
      activo: item.activo,
    })),
  };
  return items;
}

/** Primera foto de entrada (ya viene en el payload de /api/locales). */
export function portadaLocal(local: LocalItem | null | undefined): string | null {
  if (!local) return null;
  const own = local.fotos[0]?.rutaArchivo?.trim();
  if (own) return own;
  const raw = rawLocalesById.get(local.id);
  if (!raw) return null;
  return parseFotos(raw.fotos, local.id)[0]?.rutaArchivo ?? null;
}

/** Reparsea fotos desde el payload crudo (sin re-fetch) al abrir detalle/editar. */
export function hydrateLocalFotos(local: LocalItem): LocalItem {
  const raw = rawLocalesById.get(local.id);
  if (!raw) return local;
  return parseLocal(raw, { includeFotos: true }) ?? local;
}

export function invalidateLocalesCaches() {
  localesListCache = null;
  localesLiteCache = null;
  rawLocalesById = new Map();
}

/** Opción liviana para pickers (hoja ruta, asignar, etc.). */
export type LocalLiteOption = {
  id: string;
  nombre: string;
  direccion: string;
  asesorBioClim: string;
};

type LocalLiteCached = LocalLiteOption & { activo: boolean };

let localesLiteCache: { at: number; items: LocalLiteCached[] } | null = null;
const LOCALES_LITE_CACHE_MS = 5 * 60 * 1000;

/** Cache del listado de Locales (sin fotos). */
let localesListCache: { at: number; items: LocalItem[] } | null = null;
const LOCALES_LIST_CACHE_MS = 3 * 60 * 1000;

/** Filas crudas para hidratar fotos on-demand. */
let rawLocalesById = new Map<string, UnknownRecord>();

/**
 * Parsea solo id/nombre/dirección (sin fotos ni métodos).
 * Cache 5 min compartida entre pantallas que listan locales.
 */
export async function fetchLocalesLite(opts?: {
  force?: boolean;
  onlyActivos?: boolean;
}): Promise<LocalLiteOption[]> {
  if (
    !opts?.force &&
    localesLiteCache &&
    Date.now() - localesLiteCache.at < LOCALES_LITE_CACHE_MS
  ) {
    const cached = localesLiteCache.items;
    const rows = opts?.onlyActivos ? cached.filter((item) => item.activo) : cached;
    return rows.map(({ id, nombre, direccion, asesorBioClim }) => ({
      id,
      nombre,
      direccion,
      asesorBioClim,
    }));
  }

  const payload = await api<unknown>("/api/locales");
  const items: LocalLiteCached[] = asRows(payload, "locales")
    .map((row) => {
      const id = text(row.id);
      if (!id) return null;
      return {
        id,
        nombre: text(row.nombre, row.local_nombre) || `Local ${id}`,
        direccion: text(row.direccion, row.local_direccion),
        asesorBioClim: text(row.asesor_bio_clim),
        activo: row.activo == null ? true : bool(row.activo),
      };
    })
    .filter((item): item is LocalLiteCached => Boolean(item))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  localesLiteCache = { at: Date.now(), items };
  const rows = opts?.onlyActivos ? items.filter((item) => item.activo) : items;
  return rows.map(({ id, nombre, direccion, asesorBioClim }) => ({
    id,
    nombre,
    direccion,
    asesorBioClim,
  }));
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
