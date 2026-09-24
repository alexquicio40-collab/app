/**
 * Estados de recojo.
 * programado → en_ruta → llego → recolectado | no_recolectado → reprogramado → cerrado
 */

export const ESTADOS_RECOJO = [
  { value: "programado", label: "Programado", tone: "warn" },
  { value: "en_ruta", label: "En ruta", tone: "info" },
  { value: "llego", label: "Llegó", tone: "info" },
  { value: "recolectado", label: "Recolectado", tone: "ok" },
  { value: "no_recolectado", label: "No recolectado", tone: "danger" },
  { value: "reprogramado", label: "Reprogramado", tone: "warn" },
  { value: "cerrado", label: "Cerrado", tone: "muted" },
] as const;

export type EstadoRecojo = (typeof ESTADOS_RECOJO)[number]["value"];
export type EstadoTone = (typeof ESTADOS_RECOJO)[number]["tone"];

const LEGACY: Record<string, EstadoRecojo> = {
  pendiente: "programado",
  en_proceso: "en_ruta",
  en_camino: "en_ruta",
  completada: "recolectado",
  completado: "recolectado",
  finalizada: "recolectado",
  finalizado: "recolectado",
  cancelada: "cerrado",
  cancelado: "cerrado",
};

const TRANSICIONES: Record<EstadoRecojo, EstadoRecojo[]> = {
  programado: ["en_ruta", "reprogramado", "cerrado"],
  en_ruta: ["llego", "reprogramado", "cerrado"],
  llego: ["recolectado", "no_recolectado", "reprogramado", "cerrado"],
  recolectado: ["cerrado"],
  no_recolectado: ["reprogramado", "cerrado"],
  reprogramado: ["programado", "cerrado"],
  cerrado: ["programado"],
};

export const ESTADOS_EN_CURSO: EstadoRecojo[] = ["en_ruta", "llego"];
export const ESTADOS_EN_MAPA: EstadoRecojo[] = ["programado", "en_ruta", "llego"];

export function normalizeEstado(estado: string | null | undefined): EstadoRecojo | string {
  const value = String(estado || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  if (!value) return "programado";
  return LEGACY[value] ?? value;
}

export function asEstado(estado: string | null | undefined): EstadoRecojo {
  const code = normalizeEstado(estado);
  return isEstadoRecojo(code) ? code : "programado";
}

export function isEstadoRecojo(value: string): value is EstadoRecojo {
  return ESTADOS_RECOJO.some((item) => item.value === value);
}

export function estadoRecojoLabel(estado: string | null | undefined) {
  const code = normalizeEstado(estado);
  return ESTADOS_RECOJO.find((item) => item.value === code)?.label ?? String(estado || "—");
}

export function estadoRecojoTone(estado: string | null | undefined): EstadoTone {
  const code = normalizeEstado(estado);
  return ESTADOS_RECOJO.find((item) => item.value === code)?.tone ?? "muted";
}

export function isEnCurso(estado: string | null | undefined) {
  return ESTADOS_EN_CURSO.includes(asEstado(estado));
}

export function isEnMapa(estado: string | null | undefined) {
  return ESTADOS_EN_MAPA.includes(asEstado(estado));
}

export function isRecolectado(estado: string | null | undefined) {
  return asEstado(estado) === "recolectado";
}

export function isCerrado(estado: string | null | undefined) {
  return asEstado(estado) === "cerrado";
}

export function isAbierto(estado: string | null | undefined) {
  const code = asEstado(estado);
  return code !== "recolectado" && code !== "cerrado";
}

/** Destinos vía PUT. Recolectado entra solo por finalizar. */
export function statusTargetsForEstado(estado: string | null | undefined) {
  const next = TRANSICIONES[asEstado(estado)] ?? [];
  return next
    .filter((value) => value !== "recolectado")
    .map((value) => ESTADOS_RECOJO.find((item) => item.value === value)!)
    .filter(Boolean);
}
