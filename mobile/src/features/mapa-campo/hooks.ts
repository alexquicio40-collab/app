import { fetchLocales } from "@/features/locales/api";
import { ROUTES_POLL_MS } from "@/features/map/constants";
import { connectLiveSocket } from "@/features/map/socket";
import { fetchRoutes } from "@/features/routes/api";
import { enrichRoutesWithLocales } from "@/features/routes/lib/enrich";
import type { RouteItem } from "@/features/routes/types";
import type { LatLng } from "@/features/routes/navegacion/types";
import { limaDate } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function sortByOrden(a: RouteItem, b: RouteItem) {
  const oa = a.orden ?? 9999;
  const ob = b.orden ?? 9999;
  if (oa !== ob) return oa - ob;
  return a.localNombre.localeCompare(b.localNombre, "es");
}

function routesFingerprint(items: RouteItem[]) {
  return items.map((item) => `${item.id}:${item.estado}:${item.orden ?? ""}`).join("|");
}

/** Mis rutas del día + GPS propio (Mapa de campo ≠ Operadores flota). */
export function useMapaCampo() {
  const { user } = useAuth();
  const userId = user?.id != null ? String(user.id) : null;

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [live, setLive] = useState(false);
  const fingerprintRef = useRef("");
  const localesRef = useRef<Awaited<ReturnType<typeof fetchLocales>>>([]);

  const reload = useCallback(
    async (silent = false) => {
      if (!userId) {
        setRoutes([]);
        setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const fecha = limaDate();
        if (!localesRef.current.length) {
          localesRef.current = await fetchLocales().catch(() => []);
        }
        const rutas = await fetchRoutes({ fecha, conductorId: userId });
        const mine = enrichRoutesWithLocales(rutas, localesRef.current)
          .filter((item) => item.conductorId === userId)
          .sort(sortByOrden);

        const nextFp = routesFingerprint(mine);
        if (nextFp !== fingerprintRef.current) {
          fingerprintRef.current = nextFp;
          setRoutes(mine);
          setSelectedId((prev) => {
            if (prev && mine.some((item) => item.id === prev)) return prev;
            const active =
              mine.find((item) => item.estado === "en_proceso" || item.estado === "en_ruta") ??
              mine.find((item) => item.estado === "pendiente") ??
              mine[0] ??
              null;
            return active?.id ?? null;
          });
        }
        if (!silent) setError(null);
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar tus rutas");
          setRoutes([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId],
  );

  const refreshOrigin = useCallback(async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      // sin GPS no bloqueamos la pantalla
    }
  }, []);

  useEffect(() => {
    void reload(false);
    void refreshOrigin();
  }, [reload, refreshOrigin]);

  // Polling silencioso del panel (paridad Flutter Timer.periodic).
  useEffect(() => {
    const timer = setInterval(() => {
      void reload(true);
      void refreshOrigin();
    }, ROUTES_POLL_MS);
    return () => clearInterval(timer);
  }, [reload, refreshOrigin]);

  // Socket: al iniciar/detener ruta, refrescar el panel al instante.
  useEffect(() => {
    if (!userId) return;
    const socket = connectLiveSocket(userId, {
      onConnect: () => setLive(true),
      onDisconnect: () => setLive(false),
      onLocation: () => undefined,
      onOffline: () => undefined,
      onRouteChanged: () => {
        void reload(true);
      },
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setLive(false);
    };
  }, [reload, userId]);

  const selected = useMemo(
    () => routes.find((item) => item.id === selectedId) ?? null,
    [routes, selectedId],
  );

  const dest =
    selected?.localLatitud != null && selected.localLongitud != null
      ? { lat: selected.localLatitud, lng: selected.localLongitud }
      : null;

  const pendientes = routes.filter((item) => item.estado === "pendiente").length;
  const enCurso = routes.filter(
    (item) => item.estado === "en_proceso" || item.estado === "en_ruta",
  ).length;

  return {
    routes,
    loading,
    error,
    selected,
    selectedId,
    setSelectedId,
    origin,
    dest,
    panelOpen,
    setPanelOpen,
    reload: () => reload(false),
    refreshOrigin,
    pendientes,
    enCurso,
    live,
  };
}
