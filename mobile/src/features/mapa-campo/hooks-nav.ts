import {
  ARRIVAL_METERS,
  advanceAlongPath,
  bearingDeg,
  haversineMeters,
  isOffDrawnRoute,
  OFF_ROUTE_METERS,
  offsetPerpendicular,
  pathLengthMeters,
  SNAP_METERS,
  shouldAcceptMove,
  slicePathBehind,
  snapToPolyline,
  stabilizeStraightMove,
  VIBE_CORRIDOR_M,
  type LockedPose,
} from "@/features/mapa-campo/lib/geo-nav";
import {
  headingToward,
  isWebMockGpsEnabled,
  MOCK_GPS_LIMA,
  mockOriginNear,
} from "@/features/mapa-campo/lib/web-mock-gps";
import type { CampoMapPayload, CampoNavState } from "@/features/mapa-campo/nav-types";
import { prioridadMeta } from "@/features/locales/lib/prioridad";
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
import { readPreciseFix, watchPreciseFix } from "@/features/map/lib/precise-location";
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
  destColor?: string | null,
  speedMps?: number | null,
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
    speedMps: speedMps ?? 0,
    dest,
    destColor: destColor ?? null,
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
  speedMps: 0,
  remainingMeters: 0,
  etaSeconds: 0,
  vehicleType: null,
};

async function readPosition(): Promise<{ origin: LatLng; heading: number; mocked: boolean; accuracy: number }> {
  // Web demo: no pedir GPS real (el prompt puede colgarse detrás del lock del browser).
  if (isWebMockGpsEnabled()) {
    return { origin: MOCK_GPS_LIMA, heading: 0, mocked: true, accuracy: 8 };
  }

  try {
    const fix = await readPreciseFix({ timeoutMs: 14000 });
    return {
      origin: { lat: fix.lat, lng: fix.lng },
      heading: fix.heading ?? 0,
      mocked: false,
      accuracy: fix.accuracy,
    };
  } catch {
    throw new Error("Activa el permiso de ubicación o prueba en un dispositivo con GPS");
  }
}

/** Navegación in-app estilo Waze (sin abrir apps externas). */
export function useCampoNav() {
  const [state, setState] = useState(IDLE);
  const [mockingGps, setMockingGps] = useState(false);
  const watchRef = useRef<{ remove: () => void } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecalcRef = useRef(0);
  const recalcBusyRef = useRef(false);
  const pendingRecalcRef = useRef<LatLng | null>(null);
  const restrictRef = useRef<Awaited<ReturnType<typeof loadNavRestrictions>>>([]);
  const restrictReadyRef = useRef(false);
  const selectedRef = useRef<SuggestedRoute | null>(null);
  const destRef = useRef<LatLng | null>(null);
  const vehicleRef = useRef<VehicleTypeNav | null>(null);
  const activeRef = useRef(false);
  const mockPosRef = useRef<LatLng | null>(null);
  const mockingRef = useRef(false);
  const lastPosRef = useRef<LatLng | null>(null);
  const lastRawRef = useRef<LatLng | null>(null);
  const lastPosAtRef = useRef(0);
  const lastOnRouteRef = useRef<LatLng | null>(null);
  const stablePoseRef = useRef<LockedPose | null>(null);
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
    lastRawRef.current = null;
    lastPosAtRef.current = 0;
    lastOnRouteRef.current = null;
    stablePoseRef.current = null;
    lastRecalcRef.current = 0;
    recalcBusyRef.current = false;
    pendingRecalcRef.current = null;
    restrictRef.current = [];
    restrictReadyRef.current = false;
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
      const onRoad = position;
      const roadHeading = snap.dist <= SNAP_METERS ? heading || snap.heading : heading;
      const remaining =
        snap.dist <= OFF_ROUTE_METERS
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
        speedMps: prev.speedMps ?? 0,
        remainingMeters: remaining,
        etaSeconds: Math.round(pick.durationSeconds * speedFactor),
      }));
    },
    [],
  );

  const calculate = useCallback(
    async (
      origin: LatLng,
      dest: LatLng,
      vehicleType: VehicleTypeNav | null,
      opts?: { quick?: boolean },
    ) => {
      if (!restrictReadyRef.current) {
        restrictRef.current = await loadNavRestrictions();
        restrictReadyRef.current = true;
      }
      return fetchSuggestedRoutes({
        origin,
        destination: dest,
        vehicleType,
        restrictions: restrictRef.current,
        alternatives: !opts?.quick,
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
        accuracy?: number | null;
        speed?: number | null;
      },
      opts?: { force?: boolean },
    ) => {
      if (!activeRef.current) return;
      const raw = { lat: coords.latitude, lng: coords.longitude };
      const now = Date.now();
      const dt = lastPosAtRef.current ? now - lastPosAtRef.current : 1000;
      const accuracy = coords.accuracy ?? null;

      if (!opts?.force && !shouldAcceptMove(lastPosRef.current, raw, dt)) return;

      const path = selectedRef.current?.coords ?? [];
      const dest = destRef.current;
      const gpsHeading =
        Number.isFinite(coords.heading) && (coords.heading ?? -1) >= 0
          ? Number(coords.heading)
          : null;
      const lastRaw = lastRawRef.current;
      const movedMeters = lastRaw ? haversineMeters(lastRaw, raw) : 0;
      const moveHeading =
        gpsHeading ?? (lastRaw && movedMeters >= 2 ? bearingDeg(lastRaw, raw) : null);

      let position = raw;
      let heading = moveHeading ?? 0;
      let remaining = 0;
      let offRoute = false;
      const canSnap = accuracy == null || accuracy <= 40;

      if (path.length >= 2) {
        const snap = snapToPolyline(raw, path);
        remaining = snap.remainingMeters;
        offRoute = isOffDrawnRoute({
          snapDist: snap.dist,
          routeHeading: snap.heading,
          moveHeading,
          movedMeters,
          speedMps: coords.speed,
        });
        const onCorridor = !offRoute && canSnap && snap.dist <= Math.max(SNAP_METERS, VIBE_CORRIDOR_M);
        if (onCorridor) {
          const stable = stabilizeStraightMove(
            stablePoseRef.current,
            snap.point,
            snap.heading,
            coords.speed,
          );
          position = stable.pose.position;
          heading = stable.pose.heading;
          if (stable.moved) stablePoseRef.current = stable.pose;
          lastOnRouteRef.current = position;
          const progressSnap = snapToPolyline(position, path);
          remaining = progressSnap.remainingMeters;
          if (stable.moved) {
            const progress = slicePathBehind(path, progressSnap);
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
          }
        } else if (offRoute) {
          stablePoseRef.current = null;
          heading = moveHeading ?? snap.heading;
        } else {
          heading = snap.heading;
        }
      }

      const reportedSpeed =
        coords.speed != null && Number.isFinite(coords.speed) && coords.speed >= 0
          ? coords.speed
          : dt > 0
            ? Math.min(35, movedMeters / (dt / 1000))
            : 0;

      lastRawRef.current = raw;
      lastPosRef.current = position;
      lastPosAtRef.current = now;

      if (dest && haversineMeters(position, dest) <= ARRIVAL_METERS) {
        setState((prev) => ({
          ...prev,
          position,
          heading,
          speedMps: reportedSpeed,
          arrived: true,
          remainingMeters: 0,
          etaSeconds: 0,
        }));
        return;
      }

      if (path.length >= 2 && offRoute && dest) {
        if (recalcBusyRef.current) {
          pendingRecalcRef.current = raw;
        } else {
          lastRecalcRef.current = now;
          recalcBusyRef.current = true;
          pendingRecalcRef.current = null;
          if (traveledRef.current.length < 2) {
            const anchor = lastOnRouteRef.current ?? path[0]!;
            const seed = path[0] && path[0] !== anchor ? [path[0], anchor] : [anchor];
            traveledRef.current = seed;
            setTraveled(seed);
          }
          setState((prev) => ({ ...prev, recalculating: true, position, heading, speedMps: reportedSpeed }));
          void calculate(raw, dest, vehicleRef.current, { quick: true })
            .then((directions) => {
              if (!activeRef.current) return;
              const latest = lastRawRef.current ?? lastPosRef.current ?? raw;
              applyDirections(directions, latest, heading, { keepTraveled: true });
            })
            .catch(() => {
              if (!activeRef.current) return;
              setState((prev) => ({ ...prev, recalculating: false }));
            })
            .finally(() => {
              recalcBusyRef.current = false;
              const next = pendingRecalcRef.current;
              pendingRecalcRef.current = null;
              if (!next || !activeRef.current) return;
              void onPosition(
                {
                  latitude: next.lat,
                  longitude: next.lng,
                  heading,
                  accuracy,
                  speed: coords.speed,
                },
                { force: true },
              );
            });
        }
      }

      if (path.length >= 2) {
        const baseDuration = selectedRef.current?.durationSeconds ?? 0;
        const baseDist = Math.max(selectedRef.current?.distMeters ?? 1, 1);
        setState((prev) => ({
          ...prev,
          position,
          heading,
          speedMps: reportedSpeed,
          remainingMeters: remaining,
          etaSeconds: Math.max(30, Math.round(baseDuration * (remaining / baseDist))),
        }));
        return;
      }

      setState((prev) => ({ ...prev, position, heading, speedMps: reportedSpeed }));
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
              speed: 12,
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
            speed: 12,
          });
        })();
      }, 400);
      return;
    }

    try {
      const handle = await watchPreciseFix((fix) => {
        void onPosition({
          latitude: fix.lat,
          longitude: fix.lng,
          heading: fix.heading,
          accuracy: fix.accuracy,
          speed: fix.speed,
        });
      });
      watchRef.current = handle;
    } catch {
      pollRef.current = setInterval(() => {
        void (async () => {
          try {
            const { origin, heading, accuracy } = await readPosition();
            await onPosition({
              latitude: origin.lat,
              longitude: origin.lng,
              heading,
              accuracy,
            });
          } catch {
            // ignore tick
          }
        })();
      }, 400);
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
      recalcBusyRef.current = false;
      pendingRecalcRef.current = null;
      lastRawRef.current = null;
      stablePoseRef.current = null;
      void loadNavRestrictions().then((rows) => {
        restrictRef.current = rows;
        restrictReadyRef.current = true;
      });
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
        state.routeItem ? prioridadMeta(state.routeItem.prioridad).color : null,
        state.speedMps,
      ),
    [state.active, state.position, state.heading, dest, state.result, state.selectedId, traveled, state.routeItem, state.speedMps],
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
    recalcBusyRef.current = false;
    pendingRecalcRef.current = null;
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
