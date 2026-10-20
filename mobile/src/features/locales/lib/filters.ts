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

export function collectDistritos(locales: LocalItem[]) {
  const found = new Set<string>();
  for (const local of locales) {
    const d = detectDistrito(local.direccion);
    if (d) found.add(d);
  }
  const list = [...found].sort((a, b) => a.localeCompare(b, "es"));
  return list.length ? list : [...LIMA_DISTRITOS];
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

export function filterLocales(locales: LocalItem[], filters: LocalesFilters) {
  const query = filters.search.trim();

  return locales
    .filter((local) => {
      const matchSearch = matchesSearch(local, query);

      const matchDistrito =
        !filters.distrito ||
        local.direccion.toLowerCase().includes(filters.distrito.toLowerCase());

      const matchCert = matchesCert(local, filters.certificacion);

      const matchFreq =
        !filters.frecuencia ||
        local.frecuencias.some((f) => f.toLowerCase() === filters.frecuencia!.toLowerCase());

      const matchPrioridad =
        !filters.prioridad || normalizePrioridad(local.prioridad) === filters.prioridad;

      return matchSearch && matchDistrito && matchCert && matchFreq && matchPrioridad;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
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
