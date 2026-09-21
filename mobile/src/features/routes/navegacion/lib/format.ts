import type { LatLng } from "../types";

/** Decodifica overview_polyline de Google Directions. */
export function decodePolyline(encoded: string): LatLng[] {
  const coords: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coords;
}

/** Penalización Flutter: 45s por km extra → prioriza rutas cortas. */
export const KM_PENALTY_SECONDS = 45;

export function routeScore(durationSeconds: number, distMeters: number) {
  return durationSeconds + (distMeters / 1000) * KM_PENALTY_SECONDS;
}

export function formatDuration(seconds: number) {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function deltaLabel(bestSeconds: number, altSeconds: number) {
  const diff = Math.round((altSeconds - bestSeconds) / 60);
  if (diff === 0) return "≈ mismo tiempo";
  if (diff > 0) return `+${diff} min`;
  return `${diff} min`;
}

/** Etiqueta de lentitud según duration_in_traffic / duration. */
export function trafficLabel(ratio: number | null) {
  if (ratio == null || ratio < 1.08) return { text: "Fluido", tone: "ok" as const };
  if (ratio < 1.25) return { text: "Lento", tone: "warn" as const };
  return { text: "Muy lento", tone: "bad" as const };
}

export function midCoord(coords: LatLng[]): LatLng | null {
  if (!coords.length) return null;
  return coords[Math.floor(coords.length / 2)] ?? coords[0] ?? null;
}
