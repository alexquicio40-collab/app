import { limaDate } from "@/lib/api";
import { asEstado, isEnCurso, isRecolectado } from "./estados-recojo";
import { LIMA_DISTRITOS, toDayKey } from "./format";
import type { RouteItem, RoutesCounts, RoutesFilters } from "../types";

export function createDefaultFilters(): RoutesFilters {
  const today = limaDate();
  return {
    search: "",
    distrito: null,
    conductorId: null,
    estado: null,
    fechaDesde: today,
    fechaHasta: today,
  };
}

/** @deprecated usar createDefaultFilters — se mantiene por compat. */
export const EMPTY_FILTERS = createDefaultFilters();

export function collectDistritos(routes: RouteItem[]) {
  const found = new Set<string>();
  for (const route of routes) {
    const address = route.localDireccion.toLowerCase();
    for (const distrito of LIMA_DISTRITOS) {
      if (address.includes(distrito.toLowerCase())) found.add(distrito);
    }
  }
  const list = [...found].sort((a, b) => a.localeCompare(b, "es"));
  return list.length ? list : [...LIMA_DISTRITOS];
}

function inDateRange(dayKey: string, desde: string | null, hasta: string | null) {
  if (!desde && !hasta) return true;
  if (!dayKey) return false;
  if (desde && dayKey < desde) return false;
  if (hasta && dayKey > hasta) return false;
  return true;
}

export function filterRoutes(routes: RouteItem[], filters: RoutesFilters) {
  const query = filters.search.trim().toLowerCase();

  const filtered = routes.filter((route) => {
    const matchSearch =
      !query ||
      route.localNombre.toLowerCase().includes(query) ||
      route.localDireccion.toLowerCase().includes(query) ||
      route.conductorNombre.toLowerCase().includes(query) ||
      route.id.includes(query);

    const matchDistrito =
      !filters.distrito || route.localDireccion.toLowerCase().includes(filters.distrito.toLowerCase());

    const matchConductor = !filters.conductorId || route.conductorId === filters.conductorId;

    const matchEstado = !filters.estado || asEstado(route.estado) === filters.estado;

    const matchFecha = inDateRange(
      toDayKey(route.fechaAsignacion),
      filters.fechaDesde,
      filters.fechaHasta,
    );

    return matchSearch && matchDistrito && matchConductor && matchEstado && matchFecha;
  });

  // Orden de visita: mismo día + un solo conductor (filtro admin u operador ya scoped).
  const sameDay =
    Boolean(filters.fechaDesde) &&
    Boolean(filters.fechaHasta) &&
    filters.fechaDesde === filters.fechaHasta;
  const singleConductor =
    Boolean(filters.conductorId) ||
    (filtered.length > 0 &&
      filtered.every((item) => item.conductorId && item.conductorId === filtered[0]!.conductorId));
  const byOrder = sameDay && singleConductor;

  filtered.sort((a, b) => {
    if (byOrder) {
      const oa = a.orden ?? 9999;
      const ob = b.orden ?? 9999;
      if (oa !== ob) return oa - ob;
    }
    return b.fechaAsignacion.localeCompare(a.fechaAsignacion);
  });

  return filtered;
}

export function countByEstado(routes: RouteItem[]): RoutesCounts {
  let programado = 0;
  let enCurso = 0;
  let recolectado = 0;

  for (const route of routes) {
    if (asEstado(route.estado) === "programado") programado += 1;
    else if (isEnCurso(route.estado)) enCurso += 1;
    else if (isRecolectado(route.estado)) recolectado += 1;
  }

  return { programado, enCurso, recolectado };
}

export function hasActiveFilters(filters: RoutesFilters) {
  const today = limaDate();
  const dateIsDefault =
    filters.fechaDesde === today && filters.fechaHasta === today;

  return Boolean(
    filters.search.trim() ||
      filters.distrito ||
      filters.conductorId ||
      filters.estado ||
      !dateIsDefault,
  );
}
