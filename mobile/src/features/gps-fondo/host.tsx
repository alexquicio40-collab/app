import { abrirCanal, cerrarCanal } from "@/features/gps-fondo/canal";
import { mapaOcupado, onMapaOcupado } from "@/features/gps-fondo/mapa-ocupado";
import { startServicioNativo, stopServicioNativo } from "@/features/gps-fondo/servicio";
import { GPS_TASK } from "@/features/gps-fondo/task";
import { clearGpsUser, publishFix, saveGpsUser } from "@/features/gps-fondo/publish";
import { useAuth } from "@/providers/auth-provider";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { AppState, PermissionsAndroid, Platform } from "react-native";

let tareaMigrada = false;

const RELOJ = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 8000,
  distanceInterval: 15,
};

/**
 * Sin foregroundService: ese objeto arranca el LocationTaskService de Expo,
 * que en Android 12–16 cierra la app con "BIOCLIM continúa fallando".
 * La notificación la publica bioclim-location.
 */
function kmh(speed: number | null | undefined) {
  return Math.max(0, (speed ?? 0) * 3.6);
}

function publicar(pos: Location.LocationObject) {
  if ((pos.coords.accuracy ?? 999) > 80) return;
  void publishFix(pos.coords.latitude, pos.coords.longitude, kmh(pos.coords.speed));
}

/** Permisos en el orden de la documentación de Expo Location. */
async function pedirPermisos() {
  const fg = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
  if (!fg.granted) return false;
  if (Platform.OS === "android" && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).catch(() => null);
  }
  await Location.requestBackgroundPermissionsAsync().catch(() => null);
  return true;
}

/**
 * Un solo FGS: bioclim-location (como LocationUpdatesForegroundService).
 * startLocationUpdatesAsync de Expo sigue armando LocationTaskService y
 * Android 14–16 mata el proceso a ~60 s.
 */
async function arrancarFondo() {
  if (Platform.OS === "web") return;
  if (AppState.currentState !== "active" || mapaOcupado()) return;
  const fg = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false }));
  if (!fg.granted) return;
  await cortarTarea();
  await startServicioNativo();
}

async function cortarTarea() {
  if (Platform.OS === "web") return;
  try {
    const activo = await Location.hasStartedLocationUpdatesAsync(GPS_TASK).catch(() => false);
    if (activo) await Location.stopLocationUpdatesAsync(GPS_TASK);
  } catch {
    // ignore
  }
  tareaMigrada = false;
}

async function cortarServicio() {
  await cortarTarea();
  await stopServicioNativo();
}

/** GPS de cualquier usuario logueado, con notificación fija y segundo plano. */
export function GpsFondoHost() {
  const { status, user } = useAuth();
  const watch = useRef<Location.LocationSubscription | number | null>(null);
  const pulso = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    const userId = user?.id != null ? String(user.id) : "";
    const sigue = status === "authenticated" && Boolean(userId);
    if (!sigue) {
      void parar();
      return;
    }

    let vivo = true;
    void arrancar(userId, () => vivo);
    const app = AppState.addEventListener("change", (state) => {
      if (!vivo || state !== "active" || mapaOcupado()) return;
      void arrancarFondo().catch(() => undefined);
    });
    const mapa = onMapaOcupado((ocupado) => {
      if (!vivo) return;
      if (ocupado) {
        void soltarReloj();
        void cortarServicio();
        return;
      }
      void arrancar(userId, () => vivo);
    });

    return () => {
      vivo = false;
      app.remove();
      mapa();
      void soltarReloj();
    };

    async function arrancar(id: string, activo: () => boolean) {
      try {
        await saveGpsUser(id);
        abrirCanal(id);
        if (!activo()) return;
        if (Platform.OS === "web") {
          arrancarWeb(activo);
          return;
        }
        const ok = await pedirPermisos();
        if (!ok || !activo()) return;
        if (mapaOcupado()) return;
        if (watch.current == null) {
          watch.current = await Location.watchPositionAsync(RELOJ, publicar);
        }
        if (!pulso.current) {
          pulso.current = setInterval(() => {
            if (!activo() || mapaOcupado()) return;
            void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
              .then(publicar)
              .catch(() => undefined);
          }, 12000);
        }
        await arrancarFondo();
      } catch {
        // Un fallo de GPS no puede tumbar la app.
      }
    }

    function arrancarWeb(activo: () => boolean) {
      if (mapaOcupado()) return;
      if (typeof navigator === "undefined" || !navigator.geolocation || watch.current != null) {
        return;
      }
      watch.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!activo()) return;
          if ((pos.coords.accuracy ?? 999) > 80) return;
          void publishFix(pos.coords.latitude, pos.coords.longitude, kmh(pos.coords.speed));
        },
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 8000, timeout: 12000 },
      );
    }

    async function parar() {
      await soltarReloj();
      cerrarCanal();
      await cortarServicio();
      await clearGpsUser();
    }

    async function soltarReloj() {
      if (pulso.current) {
        clearInterval(pulso.current);
        pulso.current = null;
      }
      const actual = watch.current;
      watch.current = null;
      if (typeof actual === "number") {
        navigator.geolocation?.clearWatch(actual);
        return;
      }
      actual?.remove();
    }
  }, [status, user?.id]);

  return null;
}
