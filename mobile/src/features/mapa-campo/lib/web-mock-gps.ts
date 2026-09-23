import type { LatLng } from "@/features/routes/navegacion/types";
import { Platform } from "react-native";

/** Lima centro — fallback si no hay destino ni GPS. */
export const MOCK_GPS_LIMA: LatLng = { lat: -12.0464, lng: -77.0428 };

const EARTH_M = 111_320;

/**
 * En web (PC sin GPS) usamos simulación automática.
 * Desactivar: EXPO_PUBLIC_MOCK_GPS=0
 */
export function isWebMockGpsEnabled() {
  if (Platform.OS !== "web") return false;
  const flag = process.env.EXPO_PUBLIC_MOCK_GPS;
  if (flag === "0" || flag === "false") return false;
  return true;
}

/** Punto a ~metros del destino (norte-oeste) para simular “estoy yendo”. */
export function mockOriginNear(dest: LatLng, meters = 450): LatLng {
  const dLat = meters / EARTH_M;
  const dLng = meters / (EARTH_M * Math.cos((dest.lat * Math.PI) / 180));
  return {
    lat: dest.lat + dLat * 0.85,
    lng: dest.lng - dLng * 0.55,
  };
}

/** Avanza un paso hacia el destino (simula movimiento en web). */
export function stepToward(
  from: LatLng,
  to: LatLng,
  stepMeters = 35,
): LatLng {
  const dLat = (to.lat - from.lat) * EARTH_M;
  const dLng =
    (to.lng - from.lng) * EARTH_M * Math.cos((from.lat * Math.PI) / 180);
  const dist = Math.hypot(dLat, dLng);
  if (dist <= stepMeters) return { ...to };
  const t = stepMeters / dist;
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

export function headingToward(from: LatLng, to: LatLng): number {
  const y = Math.sin(((to.lng - from.lng) * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180);
  const x =
    Math.cos((from.lat * Math.PI) / 180) * Math.sin((to.lat * Math.PI) / 180) -
    Math.sin((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.cos(((to.lng - from.lng) * Math.PI) / 180);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}
