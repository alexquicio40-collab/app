import type { RouteItem } from "@/features/routes/types";

/** Resumen corto de envases/bidones para chips y HUD. */
export function routeRecogeHint(route: RouteItem): string | null {
  const parts = [
    route.tipoEnvase || null,
    route.cantidadEnvases ? `${route.cantidadEnvases} env.` : null,
    route.cantidadBidonesAzules ? `${route.cantidadBidonesAzules} azules` : null,
    route.cantidadBidonesBlancos ? `${route.cantidadBidonesBlancos} blancos` : null,
    route.bidonPasadoPor ? `pers. ${route.bidonPasadoPor}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Resumen de métodos de pago del local. */
export function routePagoHint(route: RouteItem): string | null {
  if (!route.metodosPago.length) return null;
  return route.metodosPago.map((m) => m.nombre).join(" · ");
}
