import { abrirCanal, cerrarCanal } from "@/features/gps-fondo/canal";
import { GPS_TASK } from "@/features/gps-fondo/task";
import { clearGpsUser, publishFix, saveGpsUser } from "@/features/gps-fondo/publish";
import { useAuth } from "@/providers/auth-provider";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";

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

async function pedirNotificaciones() {
  if (Platform.OS !== "android" || Platform.Version < 33) return;
  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  } catch {
    // Sin este permiso la notificación puede no verse, el servicio igual arranca.
  }
}

/** GPS de cualquier usuario logueado, con notificación fija y segundo plano. */
export function GpsFondoHost() {
  const { status, user } = useAuth();
  const watch = useRef<Location.LocationSubscription | number | null>(null);
  const pulso = useRef<ReturnType<typeof setInterval> | null>(null);
  const guarda = useRef<ReturnType<typeof setInterval> | null>(null);

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

    return () => {
      vivo = false;
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
        const fg = await Location.requestForegroundPermissionsAsync().catch(() => ({
          granted: false,
        }));
        if (!fg.granted || !activo()) return;
        await pedirNotificaciones();
        await Location.requestBackgroundPermissionsAsync().catch(() => null);
        if (!activo()) return;
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
        if (!guarda.current) {
          guarda.current = setInterval(() => {
            if (!activo()) return;
            void arrancarFondo();
          }, 20000);
        }
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
      if (guarda.current) {
        clearInterval(guarda.current);
        guarda.current = null;
      }
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

async function arrancarFondo() {
  if (Platform.OS === "web") return;
  try {
    const activo = await Location.hasStartedLocationUpdatesAsync(GPS_TASK).catch(() => false);
    if (!activo) await Location.startLocationUpdatesAsync(GPS_TASK, FONDO);
  } catch {
    // Si el servicio no arranca, el watch en primer plano sigue.
  }
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
