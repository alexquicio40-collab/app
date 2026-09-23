import { getGoogleMapsKey } from "@/features/map/lib/google-map";
import { fetchRestrictions } from "@/features/routes/assign/api";
import { Platform } from "react-native";
import {
  decodePolyline,
  formatDistance,
  formatDuration,
  routeScore,
} from "./lib/format";
import {
  activeRestrictionsFor,
  routeHitsRestriction,
  routeThroughSea,
} from "./lib/geo";
import type {
  DirectionsResult,
  LatLng,
  RestrictionBox,
  SuggestedRoute,
  VehicleTypeNav,
} from "./types";

type GoogleLeg = {
  distance?: { value?: number };
  duration?: { value?: number };
  duration_in_traffic?: { value?: number };
};

type GoogleRoute = {
  overview_polyline?: { points?: string };
  legs?: GoogleLeg[];
};

type GoogleDirectionsResponse = {
  status?: string;
  routes?: GoogleRoute[];
  error_message?: string;
};

function fixDest(lat: number, lng: number): LatLng {
  if (Math.abs(lat) > 50 && Math.abs(lng) < 50) return { lat: lng, lng: lat };
  return { lat, lng };
}

function parseCandidate(
  route: GoogleRoute,
  index: number,
): Omit<SuggestedRoute, "label" | "isBest" | "score"> | null {
  const encoded = route.overview_polyline?.points;
  if (!encoded) return null;
  const coords = decodePolyline(encoded);
  if (coords.length < 2) return null;

  let dist = 0;
  let duration = 0;
  let durationNormal = 0;
  for (const leg of route.legs ?? []) {
    dist += Number(leg.distance?.value ?? 0);
    const traffic = Number(leg.duration_in_traffic?.value ?? 0);
    const normal = Number(leg.duration?.value ?? 0);
    duration += traffic || normal;
    durationNormal += normal;
  }

  return {
    id: `r${index}`,
    coords,
    durationSeconds: duration || 1,
    distMeters: dist,
    trafficRatio: durationNormal > 0 && duration > 0 ? duration / durationNormal : null,
  };
}

function scoreAndPick(
  routes: GoogleRoute[],
  boxes: RestrictionBox[],
  vehicleType: VehicleTypeNav | null,
): DirectionsResult {
  const raw: SuggestedRoute[] = [];
  routes.forEach((route, index) => {
    const parsed = parseCandidate(route, index);
    if (!parsed) return;
    if (routeThroughSea(parsed.coords)) return;
    if (boxes.length && routeHitsRestriction(parsed.coords, boxes)) return;
    raw.push({
      ...parsed,
      score: routeScore(parsed.durationSeconds, parsed.distMeters),
      label: "",
      isBest: false,
    });
  });

  let pool = raw;
  if (!pool.length) {
    routes.forEach((route, index) => {
      const parsed = parseCandidate(route, index);
      if (!parsed) return;
      if (routeThroughSea(parsed.coords)) return;
      pool.push({
        ...parsed,
        score: routeScore(parsed.durationSeconds, parsed.distMeters),
        label: "",
        isBest: false,
      });
    });
  }

  if (!pool.length) {
    throw new Error("No hay rutas válidas hacia el destino");
  }

  pool = pool.sort((a, b) => a.score - b.score);
  const best = { ...pool[0]!, isBest: true, label: "Más corta" };
  const alternatives = pool.slice(1, 4).map((item, i) => ({
    ...item,
    isBest: false,
    label: i === 0 ? "Alternativa" : `Opción ${i + 2}`,
  }));

  const message = boxes.length
    ? `Evitando restricciones (${vehicleType ?? "vehículo"}) · mejor ${formatDistance(best.distMeters)} / ${formatDuration(best.durationSeconds)}`
    : `Mejor ruta ${formatDistance(best.distMeters)} · ${formatDuration(best.durationSeconds)}`;

  return { best, alternatives, message };
}

export async function loadNavRestrictions(): Promise<RestrictionBox[]> {
  try {
    const rows = await fetchRestrictions();
    return rows.map((item) => ({
      tipoVehiculo: item.tipoVehiculo,
      minLat: item.minLat,
      maxLat: item.maxLat,
      minLng: item.minLng,
      maxLng: item.maxLng,
      activo: item.activo,
    }));
  } catch {
    return [];
  }
}

type FetchOptions = {
  origin: LatLng;
  destination: LatLng;
  vehicleType?: VehicleTypeNav | null;
  restrictions?: RestrictionBox[];
};

/** Carga Google Maps JS en web (DirectionsService evita CORS del REST). */
function loadGoogleMapsJs(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Sin window"));
  const g = window as unknown as { google?: { maps?: { DirectionsService?: unknown } } };
  if (g.google?.maps?.DirectionsService) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-bioclim-maps]");
    if (existing) {
      if (g.google?.maps?.DirectionsService) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps")));
      // Script ya cargado pero google aún no visible: reintentar breve.
      const started = Date.now();
      const poll = setInterval(() => {
        if (g.google?.maps?.DirectionsService) {
          clearInterval(poll);
          resolve();
        } else if (Date.now() - started > 12_000) {
          clearInterval(poll);
          reject(new Error("Timeout cargando Google Maps"));
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.dataset.bioclimMaps = "1";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(getGoogleMapsKey())}&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
    document.head.appendChild(script);
  });
}

type JsLeg = {
  distance?: { value?: number };
  duration?: { value?: number };
  duration_in_traffic?: { value?: number };
};

/** Directions vía Maps JS (web). */
async function fetchDirectionsViaMapsJs(
  origin: LatLng,
  destination: LatLng,
): Promise<Array<GoogleRoute & { _path?: LatLng[] }>> {
  await loadGoogleMapsJs();
  const maps = (window as unknown as { google: { maps: any } }).google.maps;

  return new Promise((resolve, reject) => {
    const service = new maps.DirectionsService();
    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        region: "PE",
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: maps.TrafficModel.BEST_GUESS,
        },
      },
      (result: { routes?: any[] } | null, status: string) => {
        if (status !== "OK" || !result?.routes?.length) {
          reject(
            new Error(
              status === "ZERO_RESULTS" ? "No se encontraron rutas" : `Directions: ${status}`,
            ),
          );
          return;
        }

        const routes = result.routes.map((route: any) => {
          const path: LatLng[] = (route.overview_path ?? []).map(
            (p: { lat: () => number; lng: () => number }) => ({
              lat: p.lat(),
              lng: p.lng(),
            }),
          );
          const legs: JsLeg[] = (route.legs ?? []).map((leg: any) => ({
            distance: { value: Number(leg.distance?.value ?? 0) },
            duration: { value: Number(leg.duration?.value ?? 0) },
            duration_in_traffic: leg.duration_in_traffic
              ? { value: Number(leg.duration_in_traffic.value ?? 0) }
              : undefined,
          }));
          const points =
            typeof route.overview_polyline === "string"
              ? route.overview_polyline
              : String(route.overview_polyline?.points ?? "");

          return {
            overview_polyline: { points },
            legs,
            _path: path,
          };
        });

        resolve(routes);
      },
    );
  });
}

function parseCandidateFromJs(
  route: GoogleRoute & { _path?: LatLng[] },
  index: number,
): Omit<SuggestedRoute, "label" | "isBest" | "score"> | null {
  const coords =
    route._path && route._path.length >= 2
      ? route._path
      : route.overview_polyline?.points
        ? decodePolyline(route.overview_polyline.points)
        : [];
  if (coords.length < 2) return null;

  let dist = 0;
  let duration = 0;
  let durationNormal = 0;
  for (const leg of route.legs ?? []) {
    dist += Number(leg.distance?.value ?? 0);
    const traffic = Number(leg.duration_in_traffic?.value ?? 0);
    const normal = Number(leg.duration?.value ?? 0);
    duration += traffic || normal;
    durationNormal += normal;
  }

  return {
    id: `r${index}`,
    coords,
    durationSeconds: duration || 1,
    distMeters: dist || 1,
    trafficRatio: durationNormal > 0 && duration > 0 ? duration / durationNormal : null,
  };
}

function scoreAndPickJs(
  routes: Array<GoogleRoute & { _path?: LatLng[] }>,
  boxes: RestrictionBox[],
  vehicleType: VehicleTypeNav | null,
): DirectionsResult {
  const raw: SuggestedRoute[] = [];
  routes.forEach((route, index) => {
    const parsed = parseCandidateFromJs(route, index);
    if (!parsed) return;
    if (routeThroughSea(parsed.coords)) return;
    if (boxes.length && routeHitsRestriction(parsed.coords, boxes)) return;
    raw.push({
      ...parsed,
      score: routeScore(parsed.durationSeconds, parsed.distMeters),
      label: "",
      isBest: false,
    });
  });

  let pool = raw;
  if (!pool.length) {
    routes.forEach((route, index) => {
      const parsed = parseCandidateFromJs(route, index);
      if (!parsed) return;
      if (routeThroughSea(parsed.coords)) return;
      pool.push({
        ...parsed,
        score: routeScore(parsed.durationSeconds, parsed.distMeters),
        label: "",
        isBest: false,
      });
    });
  }

  if (!pool.length) throw new Error("No hay rutas válidas hacia el destino");

  pool = pool.sort((a, b) => a.score - b.score);
  const best = { ...pool[0]!, isBest: true, label: "Más corta" };
  const alternatives = pool.slice(1, 4).map((item, i) => ({
    ...item,
    isBest: false,
    label: i === 0 ? "Alternativa" : `Opción ${i + 2}`,
  }));

  const message = boxes.length
    ? `Evitando restricciones (${vehicleType ?? "vehículo"}) · mejor ${formatDistance(best.distMeters)} / ${formatDuration(best.durationSeconds)}`
    : `Mejor ruta ${formatDistance(best.distMeters)} · ${formatDuration(best.durationSeconds)}`;

  return { best, alternatives, message };
}

/**
 * Google Directions con alternatives=true.
 * Web: Maps JS DirectionsService (sin CORS). Nativo: REST JSON.
 */
export async function fetchSuggestedRoutes(options: FetchOptions): Promise<DirectionsResult> {
  const origin = options.origin;
  const destination = fixDest(options.destination.lat, options.destination.lng);
  const boxes = activeRestrictionsFor(
    options.restrictions ?? [],
    options.vehicleType ?? null,
  );

  if (Platform.OS === "web") {
    const routes = (await fetchDirectionsViaMapsJs(origin, destination)) as Array<
      GoogleRoute & { _path?: LatLng[] }
    >;
    return scoreAndPickJs(routes, boxes, options.vehicleType ?? null);
  }

  const key = getGoogleMapsKey();
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${encodeURIComponent(`${origin.lat},${origin.lng}`)}` +
    `&destination=${encodeURIComponent(`${destination.lat},${destination.lng}`)}` +
    `&key=${encodeURIComponent(key)}` +
    `&region=pe&alternatives=true&departure_time=now&traffic_model=best_guess`;

  const response = await fetch(url);
  const data = (await response.json()) as GoogleDirectionsResponse;

  if (data.status !== "OK" || !data.routes?.length) {
    throw new Error(data.error_message || data.status || "No se encontraron rutas");
  }

  return scoreAndPick(data.routes, boxes, options.vehicleType ?? null);
}
