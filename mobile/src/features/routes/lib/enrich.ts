import { normalizePrioridad } from "@/features/locales/lib/prioridad";
import type { LocalItem } from "@/features/locales/types";
import type { RouteItem } from "../types";

/** Completa envases/pagos desde el catálogo de locales si la ruta no los trae. */
export function enrichRouteWithLocal(route: RouteItem, local?: LocalItem | null): RouteItem {
  if (!local) return route;

  return {
    ...route,
    tipoEnvase: route.tipoEnvase || local.tipoEnvase || "",
    cantidadEnvases: route.cantidadEnvases ?? local.cantidadEnvases,
    cantidadBidonesAzules: route.cantidadBidonesAzules ?? local.cantidadBidonesAzules,
    cantidadBidonesBlancos: route.cantidadBidonesBlancos ?? local.cantidadBidonesBlancos,
    bidonPasadoPor: route.bidonPasadoPor ?? local.bidonPasadoPor,
    precioLitro: route.precioLitro ?? local.precioLitro,
    precioBalde: route.precioBalde ?? local.precioBalde,
    precioGalonera: route.precioGalonera ?? local.precioGalonera,
    operadoresVenPrecio: route.operadoresVenPrecio || local.operadoresVenPrecio,
    metodosPago: route.metodosPago.length
      ? route.metodosPago
      : local.metodosPago.map((item) => ({ id: item.id, nombre: item.nombre })),
    encargadoNombre: route.encargadoNombre || local.encargadoNombre,
    encargadoTelefono:
      local.operadoresVenTelefono === false
        ? route.encargadoTelefono
        : route.encargadoTelefono || local.encargadoTelefono,
    horarioEntrada: route.horarioEntrada || local.horarioEntrada,
    asesorBioClim: route.asesorBioClim || local.asesorBioClim,
    telefonoAsesor: route.telefonoAsesor || local.telefonoAsesor,
    referencia: route.referencia || local.referencia,
    localDireccion: route.localDireccion || local.direccion,
    localLatitud: route.localLatitud ?? local.latitud,
    localLongitud: route.localLongitud ?? local.longitud,
    prioridad: normalizePrioridad(local.prioridad || route.prioridad),
  };
}

export function enrichRoutesWithLocales(routes: RouteItem[], locales: LocalItem[]) {
  if (!locales.length) return routes;
  const byId = new Map(locales.map((item) => [item.id, item]));
  return routes.map((route) => enrichRouteWithLocal(route, byId.get(route.localId)));
}
