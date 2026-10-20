import { LIMA_DISTRITOS } from "@/features/routes/lib/format";
import { normName } from "@/lib/scope-user";
import { normalizePrioridad } from "./prioridad";
import type { LocalItem, LocalesCounts, LocalesFilters } from "../types";

export function createDefaultLocalFilters(): LocalesFilters {
  return {
    search: "",
    distrito: null,
    certificacion: null,
    frecuencia: null,
    prioridad: null,
  };
}

export function detectDistrito(direccion: string) {
  const address = direccion.toLowerCase();
  for (const distrito of LIMA_DISTRITOS) {
    if (address.includes(distrito.toLowerCase())) return distrito;
  }
  return null;
}

export function collectDistritos(_locales?: LocalItem[]) {
  return [...LIMA_DISTRITOS];
}

function matchesCert(local: LocalItem, filter: string | null) {
  if (!filter) return true;
  if (filter === "pendiente") {
    return local.necesitaCertificacion && local.estadoCertificacion === "pendiente";
  }
  if (filter === "emitido") {
    return local.necesitaCertificacion && local.estadoCertificacion === "ya emitido";
  }
  if (filter === "necesita") return local.necesitaCertificacion;
  if (filter === "no_necesita") return !local.necesitaCertificacion;
  return true;
}

function matchesSearch(local: LocalItem, query: string) {
  const q = normName(query);
  if (!q) return true;
  const hay = normName(
    [local.nombre, local.razonSocial, local.direccion, local.ruc, local.encargadoNombre].join(" "),
  );
  if (hay.includes(q)) return true;
  return q.split(" ").filter((part) => part.length >= 2).every((part) => hay.includes(part));
}

function matchesBase(local: LocalItem, filters: LocalesFilters) {
  if (!matchesSearch(local, filters.search.trim())) return false;
  if (filters.distrito && !local.direccion.toLowerCase().includes(filters.distrito.toLowerCase())) {
    return false;
  }
  if (
    filters.frecuencia &&
    !local.frecuencias.some((f) => f.toLowerCase() === filters.frecuencia!.toLowerCase())
  ) {
    return false;
  }
  if (filters.prioridad && normalizePrioridad(local.prioridad) !== filters.prioridad) {
    return false;
  }
  return true;
}

export function filterLocales(locales: LocalItem[], filters: LocalesFilters) {
  return locales.filter(
    (local) => matchesBase(local, filters) && matchesCert(local, filters.certificacion),
  );
}

/** Una pasada: primera página + KPIs, sin copiar ni ordenar las 10k filas. */
export function queryLocalesPage(
  locales: LocalItem[],
  filters: LocalesFilters,
  opts: {
    lista: "locales" | "certificados";
    shown: number;
    collectAll?: boolean;
  },
) {
  const searching = Boolean(filters.search.trim());
  const page: LocalItem[] = [];
  const all: LocalItem[] | null = opts.collectAll ? [] : null;
  let visible = 0;
  let mapped = 0;
  let necesitaCert = 0;
  let noNecesitaCert = 0;

  for (const local of locales) {
    if (!matchesBase(local, filters)) continue;
    if (local.necesitaCertificacion) necesitaCert += 1;
    else noNecesitaCert += 1;
    if (!matchesCert(local, filters.certificacion)) continue;

    const inLista = searching
      ? true
      : opts.lista === "certificados"
        ? local.necesitaCertificacion
        : !local.necesitaCertificacion;
    if (!inLista) continue;
    if (local.latitud != null && local.longitud != null) mapped += 1;
    if (page.length < opts.shown) page.push(local);
    all?.push(local);
    visible += 1;
  }

  return {
    page,
    visibles: all ?? page,
    visible,
    mapped,
    kpiCounts: {
      total: necesitaCert + noNecesitaCert,
      necesitaCert,
      noNecesitaCert,
    } satisfies LocalesCounts,
  };
}

export function countLocales(locales: LocalItem[]): LocalesCounts {
  let necesitaCert = 0;
  let noNecesitaCert = 0;
  for (const local of locales) {
    if (local.necesitaCertificacion) necesitaCert += 1;
    else noNecesitaCert += 1;
  }
  return { total: locales.length, necesitaCert, noNecesitaCert };
}

export function hasActiveLocalFilters(filters: LocalesFilters) {
  return Boolean(
    filters.search.trim() ||
      filters.distrito ||
      filters.certificacion ||
      filters.frecuencia ||
      filters.prioridad,
  );
}
