import type { LatLng } from "@/features/routes/navegacion/types";

const R = 6371000;

export function haversineMeters(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distancia mínima del punto a la polyline (metros). */
export function distanceToPolylineMeters(point: LatLng, path: LatLng[]) {
  if (path.length < 2) {
    return path[0] ? haversineMeters(point, path[0]) : Number.POSITIVE_INFINITY;
  }
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i]!;
    const b = path[i + 1]!;
    min = Math.min(min, distanceToSegmentMeters(point, a, b));
  }
  return min;
}

function distanceToSegmentMeters(p: LatLng, a: LatLng, b: LatLng) {
  // Proyección en plano local (metros) cerca de Lima.
  const mx = (lng: number, lat: number) => {
    const x = ((lng - a.lng) * Math.PI) / 180;
    const y = ((lat - a.lat) * Math.PI) / 180;
    const cos = Math.cos((a.lat * Math.PI) / 180);
    return { x: x * cos * R, y: y * R };
  };
  const P = mx(p.lng, p.lat);
  const A = { x: 0, y: 0 };
  const B = mx(b.lng, b.lat);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return haversineMeters(p, a);
  let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const proj = {
    lat: a.lat + t * (b.lat - a.lat),
    lng: a.lng + t * (b.lng - a.lng),
  };
  return haversineMeters(p, proj);
}

/** Metros restantes aproximados desde el punto más cercano en adelante. */
export function remainingPathMeters(point: LatLng, path: LatLng[]) {
  if (path.length < 2) return 0;
  let bestIdx = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length; i += 1) {
    const d = haversineMeters(point, path[i]!);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  let sum = best;
  for (let i = bestIdx; i < path.length - 1; i += 1) {
    sum += haversineMeters(path[i]!, path[i + 1]!);
  }
  return sum;
}

export const OFF_ROUTE_METERS = 60;
export const RECALC_COOLDOWN_MS = 15_000;
export const ARRIVAL_METERS = 40;
