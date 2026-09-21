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
    metodosPago: route.metodosPago.length
      ? route.metodosPago
      : local.metodosPago.map((item) => ({ id: item.id, nombre: item.nombre })),
    encargadoNombre: route.encargadoNombre || local.encargadoNombre,
    encargadoTelefono: route.encargadoTelefono || local.encargadoTelefono,
    localDireccion: route.localDireccion || local.direccion,
    localLatitud: route.localLatitud ?? local.latitud,
    localLongitud: route.localLongitud ?? local.longitud,
  };
}

export function enrichRoutesWithLocales(routes: RouteItem[], locales: LocalItem[]) {
  if (!locales.length) return routes;
  const byId = new Map(locales.map((item) => [item.id, item]));
  return routes.map((route) => enrichRouteWithLocal(route, byId.get(route.localId)));
}
