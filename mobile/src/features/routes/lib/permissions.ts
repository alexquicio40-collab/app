import type { RouteItem } from "../types";
import {
  asEstado,
  isAbierto,
  isRecolectado,
  normalizeEstado,
  statusTargetsForEstado,
  ESTADOS_RECOJO,
} from "./estados-recojo";

export { normalizeEstado, ESTADOS_RECOJO as ROUTE_ESTADOS };

export function isActionableRoute(route: RouteItem) {
  return !isRecolectado(route.estado);
}

export function canEditRoute(route: RouteItem) {
  return isActionableRoute(route);
}

export function canDeleteRoute(route: RouteItem) {
  const estado = asEstado(route.estado);
  return estado === "programado" || estado === "reprogramado" || estado === "cerrado" || estado === "no_recolectado";
}

export function canChangeStatus(route: RouteItem) {
  return statusTargetsFor(route).length > 0 && !isRecolectado(route.estado);
}

export function canStartRoute(route: RouteItem) {
  return asEstado(route.estado) === "programado";
}

export function canArriveRoute(route: RouteItem) {
  return asEstado(route.estado) === "en_ruta";
}

export function canFinalizeRoute(route: RouteItem) {
  return isAbierto(route.estado);
}

export function canSkipCollection(route: RouteItem) {
  return asEstado(route.estado) === "llego";
}

export function canReprogramRoute(route: RouteItem) {
  return asEstado(route.estado) === "no_recolectado";
}

export function canCloseRoute(route: RouteItem) {
  return statusTargetsFor(route).some((item) => item.value === "cerrado");
}

export function statusTargetsFor(route: RouteItem) {
  return statusTargetsForEstado(route.estado).map((item) => ({
    value: item.value,
    label: item.label,
  }));
}
