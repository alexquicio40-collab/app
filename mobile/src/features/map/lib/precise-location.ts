import { Platform } from "react-native";

export type PreciseFix = {
  lat: number;
  lng: number;
  heading: number | null;
  accuracy: number;
  speed: number | null;
};

/** Lectura que ya no sirve: ~2 cuadras o más. */
export const REJECT_ACCURACY_M = 90;
/** Objetivo al iniciar ruta / primer paint. */
export const TARGET_ACCURACY_M = 18;
/** Aceptable si el GPS no afina más a tiempo. */
export const ACCEPTABLE_ACCURACY_M = 35;

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
  const timeoutMs = opts?.timeoutMs ?? 9000;
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
        if (best && isUsableFix(best, 80)) {
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
      if (best && isUsableFix(best, 80)) resolve(best);
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
    maxAge: 6000,
    requiredAccuracy: ACCEPTABLE_ACCURACY_M,
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
      if (best && isUsableFix(best, 80)) finish(best);
      else fail("El GPS no afinó a tiempo");
    }, timeoutMs);

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 350,
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
            if (isUsableFix(fix, 80)) finish(fix);
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
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const fix = fromBrowser(pos.coords);
      if (isUsableFix(fix)) onFix(fix);
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
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 800,
        distanceInterval: 1,
        mayShowUserSettingsDialog: true,
      },
      (pos) => {
        const fix = fromExpo(pos.coords);
        if (isUsableFix(fix)) onFix(fix);
      },
    );
    return { remove: () => sub.remove() };
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error("GPS"));
    throw err;
  }
}
