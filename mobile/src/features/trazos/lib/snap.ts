import { getGoogleMapsKey } from "@/features/map/lib/google-map";
import { decodePolyline } from "@/features/routes/navegacion/lib/format";
import { Platform } from "react-native";
import { metros } from "./geo";

export type PuntoCalle = { lat: number; lng: number; at?: number };

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Sin window"));
  const g = window as unknown as { google?: { maps?: { DirectionsService?: unknown } } };
  if (g.google?.maps?.DirectionsService) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-trazos-maps]");
    if (existing) {
      const started = Date.now();
      const poll = setInterval(() => {
        if (g.google?.maps?.DirectionsService) {
          clearInterval(poll);
          resolve();
        } else if (Date.now() - started > 12_000) {
          clearInterval(poll);
          reject(new Error("Timeout Maps"));
        }
      }, 80);
      return;
    }
    const script = document.createElement("script");
    script.dataset.trazosMaps = "1";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(getGoogleMapsKey())}&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Maps"));
    document.head.appendChild(script);
  });
}

function saltoFalso(a: PuntoCalle, b: PuntoCalle) {
  const m = metros(a, b);
  if (m > 90_000) return true;
  if (a.at == null || b.at == null) return false;
  const s = Math.abs(b.at - a.at) / 1000;
  return m > 2500 && s < 45;
}

function juntar(acc: PuntoCalle[], part: PuntoCalle[]) {
  if (!part.length) return acc;
  if (!acc.length) return part.slice();
  const last = acc[acc.length - 1]!;
  const start = part[0]!;
  return metros(last, start) < 10 ? acc.concat(part.slice(1)) : acc.concat(part);
}

function pathDePasos(steps: { polyline?: { points?: string } }[] | undefined): PuntoCalle[] {
  const out: PuntoCalle[] = [];
  for (const step of steps ?? []) {
    const pts = decodePolyline(step.polyline?.points ?? "");
    for (const p of pts) out.push(p);
  }
  return out;
}

async function driveRest(a: PuntoCalle, b: PuntoCalle): Promise<PuntoCalle[]> {
  const key = getGoogleMapsKey();
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${encodeURIComponent(`${a.lat},${a.lng}`)}` +
    `&destination=${encodeURIComponent(`${b.lat},${b.lng}`)}` +
    `&mode=driving&region=pe&key=${encodeURIComponent(key)}`;
  const response = await fetch(url);
  const data = (await response.json()) as {
    status?: string;
    routes?: { legs?: { steps?: { polyline?: { points?: string } }[] }[] }[];
  };
  if (data.status !== "OK") return [];
  const out: PuntoCalle[] = [];
  for (const leg of data.routes?.[0]?.legs ?? []) {
    out.push(...pathDePasos(leg.steps));
  }
  return out;
}

async function driveJs(a: PuntoCalle, b: PuntoCalle): Promise<PuntoCalle[]> {
  await loadMaps();
  const maps = (window as unknown as { google: { maps: any } }).google.maps;
  return new Promise((resolve) => {
    const service = new maps.DirectionsService();
    service.route(
      {
        origin: { lat: a.lat, lng: a.lng },
        destination: { lat: b.lat, lng: b.lng },
        travelMode: maps.TravelMode.DRIVING,
        region: "PE",
      },
      (result: { routes?: any[] } | null, status: string) => {
        if (status !== "OK" || !result?.routes?.[0]) {
          resolve([]);
          return;
        }
        const out: PuntoCalle[] = [];
        for (const leg of result.routes[0].legs ?? []) {
          for (const step of leg.steps ?? []) {
            for (const p of step.path ?? []) {
              out.push({ lat: p.lat(), lng: p.lng() });
            }
          }
        }
        resolve(out);
      },
    );
  });
}

async function drive(a: PuntoCalle, b: PuntoCalle): Promise<PuntoCalle[]> {
  const d = metros(a, b);
  if (d < 35) return [a, b];
  try {
    const path = Platform.OS === "web" ? await driveJs(a, b) : await driveRest(a, b);
    return path.length >= 2 ? path : [];
  } catch {
    return [];
  }
}

/** Convierte waypoints GPS en el trazo por calles (tramos reales de manejo). */
export async function snapACalles(waypoints: PuntoCalle[]): Promise<{
  path: PuntoCalle[];
  km: number;
}> {
  const seed = waypoints.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (seed.length < 2) return { path: seed, km: 0 };

  let path: PuntoCalle[] = [];
  for (let i = 1; i < seed.length; i += 1) {
    const a = seed[i - 1]!;
    const b = seed[i]!;
    if (saltoFalso(a, b)) continue;
    const part = await drive(a, b);
    if (part.length >= 2) path = juntar(path, part);
  }

  let km = 0;
  for (let i = 1; i < path.length; i += 1) km += metros(path[i - 1]!, path[i]!);
  return { path, km: km / 1000 };
}
