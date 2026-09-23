import {
  ARRIVAL_METERS,
  advanceAlongPath,
  haversineMeters,
  OFF_ROUTE_METERS,
  offsetPerpendicular,
  pathLengthMeters,
  RECALC_COOLDOWN_MS,
  SNAP_METERS,
  shouldAcceptMove,
  slicePathBehind,
  snapToPolyline,
} from "@/features/mapa-campo/lib/geo-nav";
import {
  headingToward,
  isWebMockGpsEnabled,
  MOCK_GPS_LIMA,
  mockOriginNear,
} from "@/features/mapa-campo/lib/web-mock-gps";
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
  traveled: LatLng[],
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
    traveled,
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

async function readPosition(): Promise<{ origin: LatLng; heading: number; mocked: boolean }> {
  // Web demo: no pedir GPS real (el prompt puede colgarse detrás del lock del browser).
  if (isWebMockGpsEnabled()) {
    return { origin: MOCK_GPS_LIMA, heading: 0, mocked: true };
  }

  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      throw new Error("permiso");
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
        mocked: false,
      };
    } catch {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 4000,
          });
        });
        return {
          origin: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          heading: Number(pos.coords.heading) >= 0 ? Number(pos.coords.heading) : 0,
          mocked: false,
        };
      }
      throw new Error("gps");
    }
  } catch {
    throw new Error("Activa el permiso de ubicación o prueba en un dispositivo con GPS");
  }
}

/** Navegación in-app estilo Waze (sin abrir apps externas). */
export function useCampoNav() {
  const [state, setState] = useState(IDLE);
  const [mockingGps, setMockingGps] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecalcRef = useRef(0);
  const selectedRef = useRef<SuggestedRoute | null>(null);
  const destRef = useRef<LatLng | null>(null);
  const vehicleRef = useRef<VehicleTypeNav | null>(null);
  const activeRef = useRef(false);
  const mockPosRef = useRef<LatLng | null>(null);
  const mockingRef = useRef(false);
  const lastPosRef = useRef<LatLng | null>(null);
  const lastPosAtRef = useRef(0);
  const lastOnRouteRef = useRef<LatLng | null>(null);
  /** Recorrido atrás (congelado al recalcular). */
  const traveledRef = useRef<LatLng[]>([]);
  /** Base fija en el momento del desvío (no se pisa). */
  const traveledBaseRef = useRef<LatLng[]>([]);
  const [traveled, setTraveled] = useState<LatLng[]>([]);

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
    mockingRef.current = false;
    mockPosRef.current = null;
    lastPosRef.current = null;
    lastPosAtRef.current = 0;
    lastOnRouteRef.current = null;
    traveledRef.current = [];
    traveledBaseRef.current = [];
    setTraveled([]);
    setMockingGps(false);
    stopWatch();
    setState(IDLE);
    destRef.current = null;
    vehicleRef.current = null;
    selectedRef.current = null;
  }, [stopWatch]);

  const applyDirections = useCallback(
    (
      directions: DirectionsResult,
      position: LatLng,
      heading: number,
      opts?: { keepTraveled?: boolean },
    ) => {
      const pick = directions.best;
      selectedRef.current = pick;
      const snap = snapToPolyline(position, pick.coords);
      const onRoad = snap.dist <= SNAP_METERS ? snap.point : position;
      const roadHeading = snap.dist <= SNAP_METERS ? snap.heading : heading;
      const remaining =
        snap.dist <= SNAP_METERS
          ? snap.remainingMeters
          : pathLengthMeters(pick.coords);
      const speedFactor = Math.max(remaining / Math.max(pick.distMeters, 1), 0.15);
      lastPosRef.current = onRoad;
      lastOnRouteRef.current = onRoad;
      lastPosAtRef.current = Date.now();
      if (mockingRef.current) mockPosRef.current = onRoad;

      // Ruta nueva completa: limpia el historial. Tras un desvío: conserva el atrás.
      if (!opts?.keepTraveled) {
        traveledRef.current = [];
        traveledBaseRef.current = [];
        setTraveled([]);
      } else {
        traveledBaseRef.current = traveledRef.current.slice();
      }

      setState((prev) => ({
        ...prev,
        active: true,
        loading: false,
        recalculating: false,
        error: null,
        result: directions,
        selectedId: pick.id,
        position: onRoad,
        heading: roadHeading,
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
    async (
      coords: {
        latitude: number;
        longitude: number;
        heading?: number | null;
      },
      opts?: { force?: boolean },
    ) => {
      if (!activeRef.current) return;
      const raw = { lat: coords.latitude, lng: coords.longitude };
      const now = Date.now();
      const dt = lastPosAtRef.current ? now - lastPosAtRef.current : 1000;

      if (!opts?.force && !shouldAcceptMove(lastPosRef.current, raw, dt)) return;

      const path = selectedRef.current?.coords ?? [];
      const dest = destRef.current;
      const gpsHeading =
        Number.isFinite(coords.heading) && (coords.heading ?? -1) >= 0
          ? Number(coords.heading)
          : null;

      let position = raw;
      let heading = gpsHeading ?? 0;
      let remaining = 0;
      let offRoute = false;

      if (path.length >= 2) {
        const snap = snapToPolyline(raw, path);
        offRoute = snap.dist > OFF_ROUTE_METERS;
        remaining = snap.remainingMeters;
        if (snap.dist <= SNAP_METERS) {
          position = snap.point;
          heading = gpsHeading ?? snap.heading;
          lastOnRouteRef.current = position;
          const progress = slicePathBehind(path, snap);
          const base = traveledBaseRef.current;
          const behind =
            base.length >= 1
              ? (() => {
                  const head = base.slice();
                  const junction = progress[0] ?? position;
                  const last = head[head.length - 1];
                  if (!last || haversineMeters(last, junction) > 2) head.push(junction);
                  const rest = progress.slice(1);
                  return [...head, ...rest];
                })()
              : progress;
          traveledRef.current = behind;
          setTraveled(behind);
        } else {
          heading = gpsHeading ?? snap.heading;
        }
      }

      lastPosRef.current = position;
      lastPosAtRef.current = now;

      if (dest && haversineMeters(position, dest) <= ARRIVAL_METERS) {
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

      if (path.length >= 2 && offRoute && dest && now - lastRecalcRef.current > RECALC_COOLDOWN_MS) {
        lastRecalcRef.current = now;
        // Fija recorrido hasta el último punto válido en la ruta antigua
        if (traveledRef.current.length < 2) {
          const anchor = lastOnRouteRef.current ?? path[0]!;
          const seed = path[0] && path[0] !== anchor ? [path[0], anchor] : [anchor];
          traveledRef.current = seed;
          setTraveled(seed);
        }
        setState((prev) => ({ ...prev, recalculating: true, position, heading }));
        try {
          const directions = await calculate(raw, dest, vehicleRef.current);
          if (!activeRef.current) return;
          applyDirections(directions, raw, heading, { keepTraveled: true });
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

      if (path.length >= 2) {
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

    // Web sin GPS: avanza SUAVE sobre la polyline (no en línea recta)
    if (mockingRef.current) {
      pollRef.current = setInterval(() => {
        void (async () => {
          const path = selectedRef.current?.coords ?? [];
          const from = mockPosRef.current;
          if (!from || !activeRef.current) return;
          if (path.length >= 2) {
            // Si ya está fuera de ruta, no re-pegar a la polyline: deja que
            // onPosition dispare el recálculo parcial (demo desvío).
            const snap = snapToPolyline(from, path);
            if (snap.dist > OFF_ROUTE_METERS) {
              await onPosition(
                {
                  latitude: from.lat,
                  longitude: from.lng,
                  heading: snap.heading,
                },
                { force: true },
              );
              return;
            }
            const next = advanceAlongPath(from, path, 28);
            mockPosRef.current = next.point;
            await onPosition({
              latitude: next.point.lat,
              longitude: next.point.lng,
              heading: next.heading,
            });
            return;
          }
          const dest = destRef.current;
          if (!dest) return;
          const next = advanceAlongPath(from, [from, dest], 28);
          mockPosRef.current = next.point;
          await onPosition({
            latitude: next.point.lat,
            longitude: next.point.lng,
            heading: headingToward(from, dest),
          });
        })();
      }, 1800);
      return;
    }

    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1200,
          distanceInterval: 4,
        },
        (pos) => {
          void onPosition(pos.coords);
        },
      );
    } catch {
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
      }, 2000);
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
      mockingRef.current = false;
      mockPosRef.current = null;
      setMockingGps(false);

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
        let mocked = false;

        try {
          const pos = await readPosition();
          mocked = pos.mocked;
          // Si el mock genérico (Lima) está lejos del local, anclar cerca del destino
          if (mocked) {
            origin = mockOriginNear(dest);
            heading = headingToward(origin, dest);
          } else {
            origin = pos.origin;
            heading = pos.heading;
          }
        } catch (gpsErr) {
          if (isWebMockGpsEnabled()) {
            origin = opts?.originHint ?? mockOriginNear(dest);
            heading = headingToward(origin, dest);
            mocked = true;
          } else if (opts?.originHint) {
            origin = opts.originHint;
          } else {
            throw gpsErr;
          }
        }

        if (mocked) {
          mockingRef.current = true;
          mockPosRef.current = origin;
          setMockingGps(true);
        }

        const directions = await calculate(origin, dest, saved);
        if (!activeRef.current) return;

        setState((prev) => ({
          ...prev,
          vehicleType: saved,
          routeItem: item,
        }));
        applyDirections(directions, origin, heading);
        if (mocked && lastPosRef.current) {
          mockPosRef.current = lastPosRef.current;
        }

        try {
          await startWatch();
        } catch {
          // sin watch seguimos con la ruta dibujada
        }
      } catch (err) {
        activeRef.current = false;
        mockingRef.current = false;
        setMockingGps(false);
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
      const snap = snapToPolyline(prev.position, pick.coords);
      const position = snap.dist <= SNAP_METERS ? snap.point : prev.position;
      lastPosRef.current = position;
      return {
        ...prev,
        selectedId: id,
        position,
        heading: snap.dist <= SNAP_METERS ? snap.heading : prev.heading,
        remainingMeters: snap.remainingMeters,
        etaSeconds: Math.max(
          30,
          Math.round(pick.durationSeconds * (snap.remainingMeters / Math.max(pick.distMeters, 1))),
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
        traveled,
      ),
    [state.active, state.position, state.heading, dest, state.result, state.selectedId, traveled],
  );

  /** Web/mock: fuerza un desvío ~120 m para probar el recálculo parcial. */
  const simulateDetour = useCallback(() => {
    if (!activeRef.current) return;
    const path = selectedRef.current?.coords ?? [];
    const from = lastPosRef.current ?? mockPosRef.current;
    if (!from || path.length < 2) return;
    const snap = snapToPolyline(from, path);
    const next = offsetPerpendicular(from, snap.heading, 120);
    mockPosRef.current = next;
    lastRecalcRef.current = 0;
    void onPosition(
      {
        latitude: next.lat,
        longitude: next.lng,
        heading: snap.heading,
      },
      { force: true },
    );
  }, [onPosition]);

  /** Web/mock: salta al destino para probar el panel Llegaste. */
  const simulateArrive = useCallback(() => {
    if (!activeRef.current) return;
    const dest = destRef.current;
    if (!dest) return;
    mockPosRef.current = dest;
    lastPosRef.current = dest;
    setState((prev) => ({
      ...prev,
      position: dest,
      arrived: true,
      remainingMeters: 0,
      etaSeconds: 0,
      recalculating: false,
    }));
  }, []);

  return {
    ...state,
    selected,
    dest,
    mapPayload,
    mockingGps,
    start,
    stop,
    selectAlternative,
    simulateDetour,
    simulateArrive,
  };
}
