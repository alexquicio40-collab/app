import { api, limaDate } from "@/lib/api";
import { asEstado } from "./lib/estados-recojo";
import { toDayKey } from "./lib/format";
import { normalizePrioridad } from "@/features/locales/lib/prioridad";
import { resolveMediaUrl } from "./lib/format";
import type { ConductorOption, RouteItem, RouteMetodoPago } from "./types";

type UnknownRecord = Record<string, unknown>;

export type FetchRoutesQuery = {
  fecha?: string | null;
  conductorId?: string | null;
  estado?: string | null;
  localId?: string | null;
};

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

function parseMetodos(raw: unknown): RouteMetodoPago[] {
  if (!Array.isArray(raw)) return [];
  const out: RouteMetodoPago[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push({ id: out.length + 1, nombre: item.trim() });
      continue;
    }
    if (!isRecord(item)) continue;
    const nombre = text(item.nombre, item.name);
    if (!nombre) continue;
    out.push({ id: num(item.id) ?? out.length + 1, nombre });
  }
  return out;
}

function parseRoute(row: UnknownRecord): RouteItem | null {
  const id = text(row.id);
  if (!id) return null;

  // Algunos endpoints anidan el local; Flutter lee tipo_envase plano desde el JOIN.
  const local = isRecord(row.local) ? row.local : null;
  const pick = (...keys: unknown[]) => {
    for (const key of keys) {
      if (key != null && key !== "") return key;
    }
    return null;
  };

  // URLs de fotos se resuelven al abrir el detalle (más rápido en listados grandes).
  return {
    id,
    conductorId: text(row.conductor_id, row.usuario_id),
    conductorNombre: text(row.conductor_nombre) || "Sin operador",
    creadoPorId: text(row.creado_por_id, row.creadoPorId),
    creadoPorNombre: text(row.creado_por_nombre, row.creadoPorNombre),
    editadoPorNombre: text(row.editado_por_nombre, row.editadoPorNombre),
    localId: text(row.local_id, local?.id),
    localNombre: text(row.local_nombre, row.nombre, local?.nombre) || "Sin nombre",
    localDireccion: text(row.local_direccion, row.direccion, local?.direccion),
    localLatitud: num(
      row.local_latitud,
      row.latitud,
      row.lat,
      local?.latitud,
      local?.lat,
    ),
    localLongitud: num(
      row.local_longitud,
      row.longitud,
      row.lng,
      local?.longitud,
      local?.lng,
    ),
    fechaAsignacion: toDayKey(text(row.fecha_asignacion)),
    observaciones: text(row.observaciones),
    estado: asEstado(text(row.estado) || "programado"),
    orden: num(row.orden),
    fechaCompletada: text(row.fecha_completada) || null,
    litraje: num(row.cantidad_litraje),
    baldesVacios: num(row.cantidad_baldes_vacios),
    galonerasVacias: num(row.cantidad_galoneras_vacias),
    fotoGuia: text(row.foto_guia) || null,
    fotoMercaderia: text(row.foto_mercaderia) || null,
    fotoPago: text(row.foto_pago) || null,
    encargadoNombre: text(
      row.encargado_tienda,
      row.encargado_nombre,
      row.local_encargado_nombre,
      local?.encargado_tienda,
    ),
    encargadoTelefono: text(
      row.telefono_encargado,
      row.encargado_telefono,
      row.local_encargado_telefono,
      local?.telefono_encargado,
    ),
    horarioEntrada: text(
      row.horario_entrada_proveedores,
      row.horario_entrada,
      local?.horario_entrada_proveedores,
    ),
    asesorBioClim: text(row.asesor_bio_clim, row.asesor_nombre, local?.asesor_bio_clim),
    telefonoAsesor: text(row.telefono_asesor, local?.telefono_asesor),
    referencia: text(row.referencia, local?.referencia),
    tipoEnvase: text(
      row.tipo_envase,
      row.tipoEnvase,
      local?.tipo_envase,
      local?.tipoEnvase,
    ),
    cantidadEnvases: num(
      row.cantidad_envases,
      row.cantidadEnvases,
      local?.cantidad_envases,
    ),
    cantidadBidonesAzules: num(
      row.cantidad_bidones_azules,
      row.cantidadBidonesAzules,
      local?.cantidad_bidones_azules,
    ),
    cantidadBidonesBlancos: num(
      row.cantidad_bidones_blancos,
      row.cantidadBidonesBlancos,
      local?.cantidad_bidones_blancos,
    ),
    bidonPasadoPor: num(
      row.bidon_pasado_por,
      row.bidonPasadoPor,
      local?.bidon_pasado_por,
    ),
    precioLitro: num(row.precio_litro, row.precioLitro, local?.precio_litro, local?.precioLitro),
    precioBalde: num(row.precio_balde, row.precioBalde, local?.precio_balde, local?.precioBalde),
    precioGalonera: num(
      row.precio_galonera,
      row.precioGalonera,
      local?.precio_galonera,
      local?.precioGalonera,
    ),
    operadoresVenPrecio:
      row.operadores_ven_precio === 1 ||
      row.operadores_ven_precio === true ||
      row.operadoresVenPrecio === 1 ||
      row.operadoresVenPrecio === true ||
      local?.operadores_ven_precio === 1 ||
      local?.operadoresVenPrecio === true,
    metodosPago: parseMetodos(
      pick(row.metodos_pago, row.metodosPago, local?.metodos_pago, local?.metodosPago),
    ),
    prioridad: normalizePrioridad(text(row.prioridad, local?.prioridad)),
  };
}

function buildQuery(query: FetchRoutesQuery) {
  const params = new URLSearchParams();
  if (query.fecha) params.set("fecha", query.fecha);
  if (query.conductorId) params.set("conductor_id", query.conductorId);
  if (query.estado) params.set("estado", query.estado);
  if (query.localId) params.set("local_id", query.localId);
  const qs = params.toString();
  return qs ? `/api/rutas?${qs}` : "/api/rutas";
}

function daysBetween(desde: string, hasta: string) {
  const start = new Date(`${desde}T12:00:00`);
  const end = new Date(`${hasta}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [desde];
  const out: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && out.length < 31) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out.length ? out : [desde];
}

export async function fetchRutasReprogramadas() {
  return fetchRoutesOnce({ estado: "reprogramado" });
}

async function fetchRoutesOnce(query: FetchRoutesQuery = {}): Promise<RouteItem[]> {
  const payload = await api<unknown>(buildQuery(query));
  return asRows(payload, "rutas")
    .map(parseRoute)
    .filter((item): item is RouteItem => Boolean(item));
}

/** Rutas del operador entre dos días (inclusive). Un día usa una sola petición. */
export async function fetchOperadorRutasRango(operadorId: string, desde: string, hasta: string) {
  const start = desde <= hasta ? desde : hasta;
  const end = desde <= hasta ? hasta : desde;
  if (start === end) return fetchOperadorRutas(operadorId, start);

  const map = new Map<string, RouteItem>();
  const days = daysBetween(start, end);
  for (let index = 0; index < days.length; index += 7) {
    const slice = days.slice(index, index + 7);
    const batches = await Promise.all(
      slice.map((fecha) => fetchOperadorRutas(operadorId, fecha).catch(() => [] as RouteItem[])),
    );
    for (const batch of batches) {
      for (const item of batch) map.set(item.id, item);
    }
  }
  return [...map.values()];
}

/** Rutas de todos los conductores en un rango, en tandas de una semana. */
export async function fetchRoutesSpan(desde: string, hasta: string) {
  const start = desde <= hasta ? desde : hasta;
  const end = desde <= hasta ? hasta : desde;
  const map = new Map<string, RouteItem>();
  const days = daysBetween(start, end);
  for (let index = 0; index < days.length; index += 7) {
    const slice = days.slice(index, index + 7);
    const batches = await Promise.all(
      slice.map((fecha) => fetchRoutesOnce({ fecha }).catch(() => [] as RouteItem[])),
    );
    for (const batch of batches) {
      for (const item of batch) map.set(item.id, item);
    }
  }
  return [...map.values()];
}

/** Paridad Flutter `getRutasOperador` → `/api/conductores/:id/rutas`. */
export async function fetchOperadorRutas(operadorId: string, fecha?: string | null) {
  const qs = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  const payload = await api<unknown>(`/api/conductores/${operadorId}/rutas${qs}`);
  return asRows(payload, "rutas")
    .map(parseRoute)
    .filter((item): item is RouteItem => Boolean(item));
}

/**
 * Carga rutas acotadas por fecha (API `?fecha=`).
 * Por defecto: hoy (evita traer todo el histórico).
 * Rango: una petición por día en paralelo (máx. 14 días).
 */
export async function fetchRoutes(query: FetchRoutesQuery & {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
} = {}): Promise<RouteItem[]> {
  const desde = query.fechaDesde ?? query.fecha ?? null;
  const hasta = query.fechaHasta ?? query.fecha ?? null;

  if (desde && hasta && desde !== hasta) {
    const days = daysBetween(desde, hasta).slice(0, 14);
    const batches = await Promise.all(
      days.map((fecha) =>
        fetchRoutesOnce({
          fecha,
          conductorId: query.conductorId,
          estado: query.estado,
          localId: query.localId,
        }),
      ),
    );
    const map = new Map<string, RouteItem>();
    for (const batch of batches) {
      for (const item of batch) map.set(item.id, item);
    }
    return [...map.values()];
  }

  const fecha =
    (desde && hasta && desde === hasta ? desde : null) ||
    desde ||
    hasta ||
    query.fecha ||
    limaDate();

  return fetchRoutesOnce({
    fecha,
    conductorId: query.conductorId,
    estado: query.estado,
    localId: query.localId,
  });
}

function shiftDay(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y || 2026, (m || 1) - 1, (d || 1) + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function sortRecojos(rows: RouteItem[]) {
  return rows
    .slice()
    .sort((a, b) => {
      const fa = a.fechaCompletada || a.fechaAsignacion;
      const fb = b.fechaCompletada || b.fechaAsignacion;
      return fb.localeCompare(fa);
    })
    .slice(0, 30);
}

/** Últimos recojos de un local (guía / evidencias). */
export async function fetchRutasDeLocal(localId: string): Promise<RouteItem[]> {
  const direct = await fetchRoutesOnce({ localId }).catch(() => [] as RouteItem[]);
  const own = direct.filter((item) => item.localId === localId);
  if (own.length >= 3) return sortRecojos(own.map(withResolvedMedia));

  const hasta = limaDate();
  const span = await fetchRoutesSpan(shiftDay(hasta, -21), hasta).catch(() => [] as RouteItem[]);
  const merged = new Map<string, RouteItem>();
  for (const item of [...own, ...span.filter((row) => row.localId === localId)]) {
    merged.set(item.id, item);
  }
  return sortRecojos([...merged.values()].map(withResolvedMedia));
}

/** Hoy en Lima — valor por defecto para listados rápidos. */
export function defaultRoutesFecha() {
  return limaDate();
}

export function withResolvedMedia(route: RouteItem): RouteItem {
  return {
    ...route,
    fotoGuia: resolveMediaUrl(route.fotoGuia),
    fotoMercaderia: resolveMediaUrl(route.fotoMercaderia),
    fotoPago: resolveMediaUrl(route.fotoPago),
  };
}

export async function fetchConductores(): Promise<ConductorOption[]> {
  const payload = await api<unknown>("/api/conductores").catch(() => ({ conductores: [] }));
  const map = new Map<string, ConductorOption>();

  for (const row of asRows(payload, "conductores")) {
    const id = text(row.id, row.usuario_id, row.conductor_id);
    if (!id || map.has(id)) continue;
    const activo =
      row.activo == null ||
      row.activo === 1 ||
      row.activo === true ||
      row.activo === "1" ||
      row.activo === "true";
    map.set(id, {
      id,
      nombre: text(row.nombre, row.conductor_nombre, row.usuario) || `Operador ${id}`,
      activo,
    });
  }

  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export type UpdateRouteInput = {
  conductorId?: string;
  localId?: string;
  fechaAsignacion?: string;
  observaciones?: string;
  estado?: string;
  orden?: number | null;
};

export async function updateRoute(id: string, input: UpdateRouteInput) {
  const body: Record<string, unknown> = {};
  if (input.conductorId != null) body.conductor_id = Number(input.conductorId);
  if (input.localId != null) body.local_id = Number(input.localId);
  if (input.fechaAsignacion != null) {
    body.fecha_asignacion = toDayKey(input.fechaAsignacion) || input.fechaAsignacion.slice(0, 10);
  }
  if (input.observaciones != null) body.observaciones = input.observaciones;
  if (input.estado != null) body.estado = input.estado;
  if (input.orden !== undefined) body.orden = input.orden;

  const query = input.estado ? `?estado=${encodeURIComponent(input.estado)}` : "";
  return api<{ success?: boolean; message?: string }>(`/api/rutas/${id}${query}`, {
    method: "PUT",
    body,
  });
}

export async function deleteRoute(id: string) {
  return api<{ success?: boolean; message?: string }>(`/api/rutas/${id}`, {
    method: "DELETE",
  });
}

