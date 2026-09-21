import type { RouteEstado, RouteItem } from "../types";

/** Estados reales del sistema (filtro + cambios). */
export const ROUTE_ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

export type RouteEstadoValue = (typeof ROUTE_ESTADOS)[number]["value"];

export function normalizeEstado(estado: RouteEstado): string {
  const value = String(estado || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

  if (value === "en_ruta" || value === "en_camino") return "en_proceso";
  if (value === "completado" || value === "finalizada" || value === "finalizado") return "completada";
  if (value === "cancelado") return "cancelada";
  return value;
}

/** Pendiente, en proceso y cancelada admiten acciones en listado. Completadas no. */
export function isActionableRoute(route: RouteItem) {
  const estado = normalizeEstado(route.estado);
  return estado === "pendiente" || estado === "en_proceso" || estado === "cancelada";
}

export function isPendiente(route: RouteItem) {
  return normalizeEstado(route.estado) === "pendiente";
}

export function isEnProceso(route: RouteItem) {
  return normalizeEstado(route.estado) === "en_proceso";
}

export function isCancelada(route: RouteItem) {
  return normalizeEstado(route.estado) === "cancelada";
}

export function canEditRoute(route: RouteItem) {
  return isActionableRoute(route);
}

/** Eliminar: pendientes y canceladas. */
export function canDeleteRoute(route: RouteItem) {
  return isPendiente(route) || isCancelada(route);
}

/** Cambiar estado: solo en proceso. */
export function canChangeStatus(route: RouteItem) {
  return isEnProceso(route);
}

/** Operador: iniciar (vehículo → acompañantes) desde pendiente. */
export function canStartRoute(route: RouteItem) {
  return isPendiente(route);
}

/** Operador: finalizar visita (fotos / litraje según config). */
export function canFinalizeRoute(route: RouteItem) {
  return isEnProceso(route);
}

/**
 * Destinos permitidos vía PUT (no incluye completada — va por /finalizar).
 */
export function statusTargetsFor(route: RouteItem): { value: string; label: string }[] {
  if (!canChangeStatus(route)) return [];
  return [
    { value: "pendiente", label: "Pendiente" },
    { value: "cancelada", label: "Cancelada" },
  ];
}
