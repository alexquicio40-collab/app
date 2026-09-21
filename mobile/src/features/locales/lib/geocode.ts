import { getGoogleMapsKey } from "@/features/map/lib/google-map";

export type GeocodeResult = {
  lat: number;
  lng: number;
  formatted: string;
};

/**
 * Geocoding Google (mismo enfoque que Flutter: dirección + Lima, Perú).
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (query.length < 5) return null;

  const key = getGoogleMapsKey();
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?` +
    `address=${encodeURIComponent(`${query}, Lima, Perú`)}&language=es&key=${key}`;

  const res = await fetch(url);
  const data = (await res.json()) as {
    status?: string;
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat: number; lng: number } };
    }>;
  };

  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) return null;
  const loc = data.results[0].geometry.location;
  return {
    lat: loc.lat,
    lng: loc.lng,
    formatted: data.results[0].formatted_address ?? query,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = getGoogleMapsKey();
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?` +
    `latlng=${lat},${lng}&language=es&key=${key}`;

  const res = await fetch(url);
  const data = (await res.json()) as {
    status?: string;
    results?: Array<{ formatted_address?: string }>;
  };

  if (data.status !== "OK" || !data.results?.[0]?.formatted_address) return null;
  return data.results[0].formatted_address;
}
