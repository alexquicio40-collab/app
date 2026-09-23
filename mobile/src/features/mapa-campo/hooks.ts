import { fetchLocales } from "@/features/locales/api";
import { ROUTES_POLL_MS } from "@/features/map/constants";
import { connectLiveSocket } from "@/features/map/socket";
import {
  isWebMockGpsEnabled,
  MOCK_GPS_LIMA,
} from "@/features/mapa-campo/lib/web-mock-gps";
import { fetchOperadorRutas } from "@/features/routes/api";
import { enrichRoutesWithLocales } from "@/features/routes/lib/enrich";
import { normalizeEstado } from "@/features/routes/lib/permissions";
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

/** Solo rutas aún por hacer / en curso (no completadas ni canceladas). */
function isRutaActiva(route: RouteItem) {
  const estado = normalizeEstado(route.estado);
  return estado !== "completada" && estado !== "cancelada";
}

function routesFingerprint(items: RouteItem[]) {
  return items
    .map(
      (item) =>
        `${item.id}:${item.estado}:${item.orden ?? ""}:${item.tipoEnvase}:${item.cantidadEnvases ?? ""}:${item.cantidadBidonesAzules ?? ""}:${item.cantidadBidonesBlancos ?? ""}:${item.bidonPasadoPor ?? ""}:${item.metodosPago.map((m) => m.nombre).join(",")}`,
    )
    .join("|");
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
        // Endpoint Flutter: trae tipo_envase / bidones / metodos_pago del local
        const rutas = await fetchOperadorRutas(userId, fecha);
        // Refuerzo: si algún campo falta, completar desde catálogo de locales
        if (!localesRef.current.length) {
          localesRef.current = await fetchLocales().catch(() => []);
        }
        const mine = enrichRoutesWithLocales(rutas, localesRef.current)
          .filter(isRutaActiva)
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
      if (!perm.granted) throw new Error("perm");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      if (!isWebMockGpsEnabled()) return;
      // Idle: anclar cerca de la ruta seleccionada / primera con coords
      setOrigin((prev) => {
        if (prev) return prev;
        return MOCK_GPS_LIMA;
      });
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
