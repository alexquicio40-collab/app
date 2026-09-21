import type { LatLng, RestrictionBox, VehicleTypeNav } from "../types";

/** ¿El punto cae dentro del bounding box de la restricción? */
export function pointInBox(p: LatLng, box: RestrictionBox) {
  return (
    p.lat >= Math.min(box.minLat, box.maxLat) &&
    p.lat <= Math.max(box.minLat, box.maxLat) &&
    p.lng >= Math.min(box.minLng, box.maxLng) &&
    p.lng <= Math.max(box.minLng, box.maxLng)
  );
}

/** Restricciones activas para el tipo de vehículo (ligero/pesado/ambos). */
export function activeRestrictionsFor(
  boxes: RestrictionBox[],
  vehicle: VehicleTypeNav | null,
): RestrictionBox[] {
  return boxes.filter((box) => {
    if (!box.activo) return false;
    const tipo = (box.tipoVehiculo || "ambos").toLowerCase();
    if (tipo === "ambos" || tipo === "todos") return true;
    if (!vehicle) return true;
    return tipo === vehicle;
  });
}

/** ¿Algún punto de la polyline entra en zona restringida? (sample cada N). */
export function routeHitsRestriction(coords: LatLng[], boxes: RestrictionBox[]) {
  if (!boxes.length || coords.length < 2) return false;
  const step = Math.max(1, Math.floor(coords.length / 40));
  for (let i = 0; i < coords.length; i += step) {
    const p = coords[i]!;
    for (const box of boxes) {
      if (pointInBox(p, box)) return true;
    }
  }
  return false;
}

/** Heurística costa/mar cerca de Lima (igual idea Flutter: rechazar rutas por mar). */
export function routeThroughSea(coords: LatLng[]) {
  // Si un tramo largo va muy al oeste (lng < -77.35) con lat costera, sospechoso.
  let westHits = 0;
  for (const p of coords) {
    if (p.lng < -77.35 && p.lat > -12.5 && p.lat < -11.7) westHits += 1;
  }
  return westHits > Math.max(8, coords.length * 0.12);
}
