import { abrirCanal, cerrarCanal } from "@/features/gps-fondo/canal";
import { GPS_TASK } from "@/features/gps-fondo/task";
import { clearGpsUser, publishFix, saveGpsUser } from "@/features/gps-fondo/publish";
import { useAuth } from "@/providers/auth-provider";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { AppState, PermissionsAndroid, Platform } from "react-native";

const RELOJ = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 8000,
  distanceInterval: 15,
};

const FONDO: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 8000,
  distanceInterval: 15,
  deferredUpdatesInterval: 8000,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  foregroundService: {
    notificationTitle: "BIOCLIM",
    notificationBody: "Ubicación activa en segundo plano",
    notificationColor: "#0B5340",
    killServiceOnDestroy: false,
  },
};

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
 * Solo con la app en primer plano. No se detiene el servicio antes de
 * arrancarlo: ese corte deja a Android esperando startForeground y muestra
 * "sigue fallando". Si la tarea ya existe, start vuelve a publicar la notificación.
 */
async function arrancarFondo() {
  if (Platform.OS === "web") return;
  if (AppState.currentState !== "active") return;
  const fg = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false }));
  if (!fg.granted) return;
  await Location.startLocationUpdatesAsync(GPS_TASK, FONDO);
}

async function cortarServicio() {
  if (Platform.OS === "web") return;
  try {
    const activo = await Location.hasStartedLocationUpdatesAsync(GPS_TASK).catch(() => false);
    if (activo) await Location.stopLocationUpdatesAsync(GPS_TASK);
  } catch {
    // ignore
  }
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
      if (!vivo || state !== "active") return;
      void arrancarFondo().catch(() => undefined);
    });

    return () => {
      vivo = false;
      app.remove();
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
        if (watch.current == null) {
          watch.current = await Location.watchPositionAsync(RELOJ, publicar);
        }
        if (!pulso.current) {
          pulso.current = setInterval(() => {
            if (!activo()) return;
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
