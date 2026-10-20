import { Platform } from "react-native";

export type PreciseFix = {
  lat: number;
  lng: number;
  heading: number | null;
  accuracy: number;
  speed: number | null;
};

/** Lectura que ya no sirve: ~2 cuadras o más. */
export const REJECT_ACCURACY_M = 70;
/** Objetivo al iniciar ruta / primer paint. */
export const TARGET_ACCURACY_M = 15;
/** Aceptable si el GPS no afina más a tiempo. */
export const ACCEPTABLE_ACCURACY_M = 28;
/** Tope si el chip no baja de 28 m. */
export const COARSE_CAP_M = 48;
/** Espera al arrancar ruta: el primer fix suele ser red/Wi-Fi. */
export const READ_FIX_TIMEOUT_MS = 14000;
/** Cadencia del watch: 0 = tan rápido como el chip (sin espera de 2–3 s). */
export const WATCH_INTERVAL_MS = 0;

type WatchHandle = { remove: () => void };

function headingOf(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function fromBrowser(coords: GeolocationCoordinates): PreciseFix {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    heading: headingOf(coords.heading),
    accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : 999,
    speed: coords.speed != null && Number.isFinite(coords.speed) ? coords.speed : null,
  };
}

function fromExpo(coords: {
  latitude: number;
  longitude: number;
  heading?: number | null;
  accuracy?: number | null;
  speed?: number | null;
}): PreciseFix {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    heading: headingOf(coords.heading),
    accuracy: coords.accuracy != null && Number.isFinite(coords.accuracy) ? coords.accuracy : 999,
    speed: coords.speed != null && Number.isFinite(coords.speed) ? coords.speed : null,
  };
}

export function isUsableFix(fix: PreciseFix, maxM = REJECT_ACCURACY_M) {
  return Number.isFinite(fix.lat) && Number.isFinite(fix.lng) && fix.accuracy <= maxM;
}

function metersBetween(a: PreciseFix, b: PreciseFix) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * En seguimiento: publica el último GPS usable.
 * No se queda pegado al “mejor” fix viejo (eso retrasa 2–3 s y raya el punto).
 * Solo corta saltos imposibles de red/Wi-Fi.
 */
export function isLiveFix(prev: PreciseFix | null, next: PreciseFix) {
  if (!isUsableFix(next, REJECT_ACCURACY_M)) return false;
  if (!prev) return true;
  const dist = metersBetween(prev, next);
  if (next.accuracy >= 50 && dist > 90 && next.accuracy > prev.accuracy + 25) return false;
  return true;
}

/** @deprecated alias de isLiveFix — el idle y el watch usan el mismo criterio. */
export function isBetterOrStableFix(prev: PreciseFix | null, next: PreciseFix) {
  return isLiveFix(prev, next);
}

function streamWatchFixes(onFix: (fix: PreciseFix) => void) {
  let last: PreciseFix | null = null;
  return (fix: PreciseFix) => {
    if (!isLiveFix(last, fix)) return;
    last = fix;
    onFix(fix);
  };
}

export async function ensureLocationPermission() {
  if (Platform.OS === "web") {
    return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
  }
  const Location = await import("expo-location");
  const actual = await Location.getForegroundPermissionsAsync();
  if (actual.status === "granted") return true;
  const pedido = await Location.requestForegroundPermissionsAsync();
  return pedido.status === "granted";
}

/**
 * Espera un fix GPS fino (no red/Wi-Fi).
 * El primer `getCurrentPosition` suele salir 100–200 m corrido.
 */
export async function readPreciseFix(opts?: { timeoutMs?: number }): Promise<PreciseFix> {
  const timeoutMs = opts?.timeoutMs ?? READ_FIX_TIMEOUT_MS;
  if (!(await ensureLocationPermission())) {
    throw new Error("Activa el permiso de ubicación");
  }
  if (Platform.OS === "web") return readBrowserFix(timeoutMs);
  return readNativeFix(timeoutMs);
}

export async function watchPreciseFix(
  onFix: (fix: PreciseFix) => void,
  opts?: { onError?: (err: Error) => void },
): Promise<WatchHandle> {
  if (!(await ensureLocationPermission())) {
    throw new Error("Activa el permiso de ubicación");
  }
  if (Platform.OS === "web") return watchBrowser(onFix, opts?.onError);
  return watchNative(onFix, opts?.onError);
}

function readBrowserFix(timeoutMs: number): Promise<PreciseFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalización no disponible"));
      return;
    }

    let best: PreciseFix | null = null;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = fromBrowser(pos.coords);
        if (!best || fix.accuracy < best.accuracy) best = fix;
        if (fix.accuracy <= TARGET_ACCURACY_M) {
          clearTimeout(timer);
          navigator.geolocation.clearWatch(watchId);
          resolve(fix);
        }
      },
      (err) => {
        if (best && isUsableFix(best, COARSE_CAP_M)) {
          clearTimeout(timer);
          navigator.geolocation.clearWatch(watchId);
          resolve(best);
          return;
        }
        clearTimeout(timer);
        navigator.geolocation.clearWatch(watchId);
        reject(new Error(err.message || "No se pudo obtener la ubicación"));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
    );

    const timer = setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (best && isUsableFix(best, COARSE_CAP_M)) resolve(best);
      else reject(new Error("El GPS no afinó a tiempo"));
    }, timeoutMs);
  });
}

async function readNativeFix(timeoutMs: number): Promise<PreciseFix> {
  const Location = await import("expo-location");
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new Error("Activa el GPS del teléfono");
  }

  let best: PreciseFix | null = null;
  const last = await Location.getLastKnownPositionAsync({
    maxAge: 3500,
    requiredAccuracy: TARGET_ACCURACY_M,
  }).catch(() => null);
  if (last) best = fromExpo(last.coords);

  return new Promise((resolve, reject) => {
    let sub: { remove: () => void } | null = null;
    let settled = false;

    const finish = (fix: PreciseFix) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sub?.remove();
      resolve(fix);
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sub?.remove();
      reject(new Error(message));
    };

    const timer = setTimeout(() => {
      if (best && isUsableFix(best, COARSE_CAP_M)) finish(best);
      else fail("El GPS no afinó a tiempo");
    }, timeoutMs);

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: WATCH_INTERVAL_MS,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true,
      },
      (pos) => {
        const fix = fromExpo(pos.coords);
        if (!best || fix.accuracy < best.accuracy) best = fix;
        if (fix.accuracy <= TARGET_ACCURACY_M) finish(fix);
      },
    )
      .then((handle) => {
        if (settled) {
          handle.remove();
          return;
        }
        sub = handle;
      })
      .catch(() => {
        void Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        })
          .then((pos) => {
            const fix = fromExpo(pos.coords);
            if (isUsableFix(fix, COARSE_CAP_M)) finish(fix);
            else fail("La ubicación aún es imprecisa");
          })
          .catch(() => fail("No se pudo leer el GPS"));
      });
  });
}

function watchBrowser(
  onFix: (fix: PreciseFix) => void,
  onError?: (err: Error) => void,
): WatchHandle {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocalización no disponible");
  }
  const emit = streamWatchFixes(onFix);
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      emit(fromBrowser(pos.coords));
    },
    (err) => onError?.(new Error(err.message || "GPS")),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
  );
  return { remove: () => navigator.geolocation.clearWatch(id) };
}

async function watchNative(
  onFix: (fix: PreciseFix) => void,
  onError?: (err: Error) => void,
): Promise<WatchHandle> {
  const Location = await import("expo-location");
  const emit = streamWatchFixes(onFix);
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: WATCH_INTERVAL_MS,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true,
      },
      (pos) => {
        emit(fromExpo(pos.coords));
      },
    );
    return { remove: () => sub.remove() };
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error("GPS"));
    throw err;
  }
}
