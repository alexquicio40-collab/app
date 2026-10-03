import { readPreciseFix } from "./precise-location";

export type AdminCoords = {
  lat: number;
  lng: number;
  accuracy: number;
};

/** Posición actual con GPS fino. No usa red/Wi-Fi suelto. */
export async function getAdminCoords(): Promise<AdminCoords> {
  const fix = await readPreciseFix();
  return { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy };
}
