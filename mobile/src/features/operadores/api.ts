import { api } from "@/lib/api";
import type { OperatorRouteDetail } from "./types";

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
    const out = String(value).trim();
    if (out && out.toLowerCase() !== "null") return out;
  }
  return "";
}

function num(...values: unknown[]): number | null {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseFotos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isRecord(item)) return text(item.ruta_archivo, item.url, item.path);
      return "";
    })
    .filter(Boolean);
}

function parseMetodos(raw: unknown): { id: number; nombre: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (typeof item === "string" && item.trim()) {
        return { id: index + 1, nombre: item.trim() };
      }
      if (!isRecord(item)) return null;
      const nombre = text(item.nombre, item.name, item.metodo);
      if (!nombre) return null;
      return { id: num(item.id) ?? index + 1, nombre };
    })
    .filter((item): item is { id: number; nombre: string } => Boolean(item));
}

function parseRoute(row: UnknownRecord): OperatorRouteDetail {
  const necesita = row.necesita_certificacion;
  const necesitaCertificacion = !(
    necesita === false ||
    necesita === 0 ||
    String(necesita ?? "").toLowerCase() === "no" ||
    String(necesita ?? "") === ""
  );

  return {
    id: text(row.id) || String(num(row.id) ?? ""),
    localNombre: text(row.local_nombre, row.nombre) || "Local",
    localDireccion: text(row.local_direccion, row.direccion),
    estado: text(row.estado).toLowerCase() || "programado",
    latitud: num(row.latitud, row.latitude, row.lat),
    longitud: num(row.longitud, row.longitude, row.lng),
    horario: text(
      row.horario_entrada_proveedores,
      row.horario_entrada,
      row.horario,
    ).toUpperCase() || "N/A",
    asesorNombre: text(row.asesor_bio_clim, row.asesor_nombre, row.asesor),
    asesorTelefono: text(row.telefono_asesor, row.asesor_telefono, row.asesor_tel),
    encargadoNombre: text(row.encargado_tienda, row.encargado_nombre, row.encargado),
    encargadoTelefono: text(
      row.telefono_encargado,
      row.encargado_telefono,
      row.encargado_tel,
    ),
    referencia: text(row.referencia, row.referencia_local),
    necesitaCertificacion,
    tipoEnvase: text(row.tipo_envase),
    cantidadEnvases: num(row.cantidad_envases),
    cantidadBidonesAzules: num(row.cantidad_bidones_azules),
    cantidadBidonesBlancos: num(row.cantidad_bidones_blancos),
    bidonPasadoPor: num(row.bidon_pasado_por),
    metodosPago: parseMetodos(row.metodos_pago ?? row.metodosPago),
    fotos: parseFotos(row.fotos),
  };
}

/** Rutas activas del operador (paridad Flutter getConductorRutas). */
export async function fetchOperatorRoutes(operatorId: number): Promise<OperatorRouteDetail[]> {
  const payload = await api<unknown>(`/api/conductores/${operatorId}/rutas`).catch(() => ({
    rutas: [],
  }));
  const rows = asRows(payload, "rutas");
  return rows
    .map(parseRoute)
    .filter((item) => item.estado === "en_ruta" || item.estado === "llego" || item.estado === "en_proceso");
}

export async function shareRouteLink(rutaId: string): Promise<string> {
  const payload = await api<{ success?: boolean; url?: string; token?: string }>(
    `/api/rutas/${rutaId}/compartir`,
    { method: "POST", body: {} },
  );
  if (!payload?.url) throw new Error("No se pudo generar el enlace");
  return payload.url;
}
