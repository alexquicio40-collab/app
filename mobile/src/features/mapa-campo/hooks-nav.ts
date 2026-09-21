import {
  ARRIVAL_METERS,
  distanceToPolylineMeters,
  OFF_ROUTE_METERS,
  RECALC_COOLDOWN_MS,
  remainingPathMeters,
} from "@/features/mapa-campo/lib/geo-nav";
import type { CampoMapPayload, CampoNavState } from "@/features/mapa-campo/nav-types";
import { loadVehicleType } from "@/features/routes/flujo/lib/vehicle-store";
import { fetchSuggestedRoutes, loadNavRestrictions } from "@/features/routes/navegacion/api";
import {
  deltaLabel,
  formatDuration,
  midCoord,
  trafficLabel,
} from "@/features/routes/navegacion/lib/format";
import type {
  DirectionsResult,
  LatLng,
  SuggestedRoute,
  VehicleTypeNav,
} from "@/features/routes/navegacion/types";
import type { RouteItem } from "@/features/routes/types";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

function errMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

function findRoute(result: DirectionsResult | null, id: string | null): SuggestedRoute | null {
  if (!result || !id) return null;
  if (result.best.id === id) return result.best;
  return result.alternatives.find((item) => item.id === id) ?? null;
}

function toPayload(
  tracking: boolean,
  position: LatLng | null,
  heading: number,
  dest: LatLng | null,
  result: DirectionsResult | null,
  selectedId: string | null,
): CampoMapPayload {
  const routes = result ? [result.best, ...result.alternatives.slice(0, 3)] : [];
  const activeSeconds =
    routes.find((item) => item.id === selectedId)?.durationSeconds ??
    result?.best.durationSeconds ??
    0;

  return {
    type: "nav",
    tracking,
    position,
    heading,
    dest,
    selectedId,
    routes: routes.map((item) => {
      const traffic = trafficLabel(item.trafficRatio);
      return {
        id: item.id,
        coords: item.coords,
        mid: midCoord(item.coords),
        minsLabel: formatDuration(item.durationSeconds),
        delta:
          item.id === selectedId
            ? "Activa"
            : deltaLabel(activeSeconds, item.durationSeconds),
        trafficText: traffic.text,
        trafficTone: traffic.tone,
      };
    }),
  };
}

const IDLE: Omit<CampoNavState, "selected"> = {
  active: false,
  loading: false,
  recalculating: false,
  arrived: false,
  error: null,
  routeItem: null,
  result: null,
  selectedId: null,
  position: null,
  heading: 0,
  remainingMeters: 0,
  etaSeconds: 0,
  vehicleType: null,
};

async function readPosition(): Promise<{ origin: LatLng; heading: number }> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Activa el permiso de ubicación del navegador/dispositivo para navegar");
  }

  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      origin: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      heading:
        Number.isFinite(pos.coords.heading) && (pos.coords.heading ?? -1) >= 0
          ? Number(pos.coords.heading)
          : 0,
    };
  } catch {
    // Fallback web: Geolocation API nativa
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        });
      });
      return {
        origin: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        heading: Number(pos.coords.heading) >= 0 ? Number(pos.coords.heading) : 0,
      };
    }
    throw new Error("No se pudo obtener tu ubicación GPS");
  }
}

/** Navegación in-app estilo Waze (sin abrir apps externas). */
export function useCampoNav() {
  const [state, setState] = useState(IDLE);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecalcRef = useRef(0);
  const selectedRef = useRef<SuggestedRoute | null>(null);
  const destRef = useRef<LatLng | null>(null);
  const vehicleRef = useRef<VehicleTypeNav | null>(null);
  const activeRef = useRef(false);

  const selected = findRoute(state.result, state.selectedId);
  selectedRef.current = selected;

  const stopWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    stopWatch();
    setState(IDLE);
    destRef.current = null;
    vehicleRef.current = null;
    selectedRef.current = null;
  }, [stopWatch]);

  const applyDirections = useCallback(
    (directions: DirectionsResult, position: LatLng, heading: number) => {
      const pick = directions.best;
      selectedRef.current = pick;
      const remaining = remainingPathMeters(position, pick.coords);
      const speedFactor = Math.max(remaining / Math.max(pick.distMeters, 1), 0.15);
      setState((prev) => ({
        ...prev,
        active: true,
        loading: false,
        recalculating: false,
        error: null,
        result: directions,
        selectedId: pick.id,
        position,
        heading,
        remainingMeters: remaining,
        etaSeconds: Math.round(pick.durationSeconds * speedFactor),
      }));
    },
    [],
  );

  const calculate = useCallback(
    async (origin: LatLng, dest: LatLng, vehicleType: VehicleTypeNav | null) => {
      const restrictions = await loadNavRestrictions();
      return fetchSuggestedRoutes({
        origin,
        destination: dest,
        vehicleType,
        restrictions,
      });
    },
    [],
  );

  const onPosition = useCallback(
    async (coords: { latitude: number; longitude: number; heading?: number | null }) => {
      if (!activeRef.current) return;
      const position = { lat: coords.latitude, lng: coords.longitude };
      const heading =
        Number.isFinite(coords.heading) && (coords.heading ?? -1) >= 0
          ? Number(coords.heading)
          : 0;
      const path = selectedRef.current?.coords ?? [];
      const dest = destRef.current;

      if (dest && haversineArrival(position, dest) <= ARRIVAL_METERS) {
        setState((prev) => ({
          ...prev,
          position,
          heading,
          arrived: true,
          remainingMeters: 0,
          etaSeconds: 0,
        }));
        return;
      }

      if (path.length >= 2) {
        const off = distanceToPolylineMeters(position, path);
        const now = Date.now();
        if (
          off > OFF_ROUTE_METERS &&
          dest &&
          now - lastRecalcRef.current > RECALC_COOLDOWN_MS
        ) {
          lastRecalcRef.current = now;
          setState((prev) => ({ ...prev, recalculating: true, position, heading }));
          try {
            const directions = await calculate(position, dest, vehicleRef.current);
            if (!activeRef.current) return;
            applyDirections(directions, position, heading);
          } catch {
            setState((prev) => ({
              ...prev,
              recalculating: false,
              position,
              heading,
            }));
          }
          return;
        }

        const remaining = remainingPathMeters(position, path);
        const baseDuration = selectedRef.current?.durationSeconds ?? 0;
        const baseDist = Math.max(selectedRef.current?.distMeters ?? 1, 1);
        setState((prev) => ({
          ...prev,
          position,
          heading,
          remainingMeters: remaining,
          etaSeconds: Math.max(30, Math.round(baseDuration * (remaining / baseDist))),
        }));
        return;
      }

      setState((prev) => ({ ...prev, position, heading }));
    },
    [applyDirections, calculate],
  );

  const startWatch = useCallback(async () => {
    stopWatch();
    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 8,
        },
        (pos) => {
          void onPosition(pos.coords);
        },
      );
    } catch {
      // Web / entornos sin watch: polling
      pollRef.current = setInterval(() => {
        void (async () => {
          try {
            const { origin, heading } = await readPosition();
            await onPosition({
              latitude: origin.lat,
              longitude: origin.lng,
              heading,
            });
          } catch {
            // ignore tick
          }
        })();
      }, 2500);
    }
  }, [onPosition, stopWatch]);

  const start = useCallback(
    async (item: RouteItem, opts?: { vehicleType?: VehicleTypeNav | null; originHint?: LatLng | null }) => {
      if (item.localLatitud == null || item.localLongitud == null) {
        notify("Sin coordenadas", "Este local no tiene ubicación en el mapa");
        return;
      }

      const dest = { lat: item.localLatitud, lng: item.localLongitud };
      destRef.current = dest;
      activeRef.current = true;
      lastRecalcRef.current = 0;

      setState({
        ...IDLE,
        active: true,
        loading: true,
        routeItem: item,
        vehicleType: opts?.vehicleType ?? null,
      });

      try {
        const saved = opts?.vehicleType ?? (await loadVehicleType(item.id));
        vehicleRef.current = saved;

        let origin: LatLng;
        let heading = 0;
        try {
          const pos = await readPosition();
          origin = pos.origin;
          heading = pos.heading;
        } catch (gpsErr) {
          if (opts?.originHint) {
            origin = opts.originHint;
          } else {
            throw gpsErr;
          }
        }

        const directions = await calculate(origin, dest, saved);
        if (!activeRef.current) return;

        setState((prev) => ({
          ...prev,
          vehicleType: saved,
          routeItem: item,
        }));
        applyDirections(directions, origin, heading);

        // El seguimiento no debe tumbar una navegación ya calculada.
        try {
          await startWatch();
        } catch {
          // sin watch seguimos con la ruta dibujada
        }
      } catch (err) {
        activeRef.current = false;
        stopWatch();
        const message = errMessage(err, "No se pudo iniciar la navegación");
        setState({
          ...IDLE,
          error: message,
        });
      }
    },
    [applyDirections, calculate, startWatch, stopWatch],
  );

  const selectAlternative = useCallback((id: string) => {
    setState((prev) => {
      const pick = findRoute(prev.result, id);
      if (!pick || !prev.position) return prev;
      selectedRef.current = pick;
      const remaining = remainingPathMeters(prev.position, pick.coords);
      return {
        ...prev,
        selectedId: id,
        remainingMeters: remaining,
        etaSeconds: Math.max(
          30,
          Math.round(pick.durationSeconds * (remaining / Math.max(pick.distMeters, 1))),
        ),
      };
    });
  }, []);

  useEffect(() => () => stop(), [stop]);

  const dest =
    state.routeItem?.localLatitud != null && state.routeItem.localLongitud != null
      ? { lat: state.routeItem.localLatitud, lng: state.routeItem.localLongitud }
      : null;

  const mapPayload = useMemo(
    () =>
      toPayload(
        state.active,
        state.position,
        state.heading,
        dest,
        state.result,
        state.selectedId,
      ),
    [state.active, state.position, state.heading, dest, state.result, state.selectedId],
  );

  return {
    ...state,
    selected,
    dest,
    mapPayload,
    start,
    stop,
    selectAlternative,
  };
}

function haversineArrival(a: LatLng, b: LatLng) {
  const R = 6371000;
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
