import { fetchLocales, peekLocalesCache } from "@/features/locales/api";
import { ROUTES_POLL_MS } from "@/features/map/constants";
import { connectLiveSocket } from "@/features/map/socket";
import { useMyLocation } from "@/features/map/lib/use-my-location";
import { fetchOperadorRutas } from "@/features/routes/api";
import { pinColorForLocal } from "@/features/locales/lib/prioridad";
import { enrichRoutesWithLocales } from "@/features/routes/lib/enrich";
import { asEstado, isCerrado, isEnCurso, isRecolectado } from "@/features/routes/lib/estados-recojo";
import type { RouteItem } from "@/features/routes/types";
import type { CampoMapPin } from "@/features/mapa-campo/nav-types";
import { limaDate } from "@/lib/api";
import { esEmuladorAndroid, rutaDemoEmulador } from "@/lib/emulador";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function sortByOrden(a: RouteItem, b: RouteItem) {
  const oa = a.orden ?? 9999;
  const ob = b.orden ?? 9999;
  if (oa !== ob) return oa - ob;
  return a.localNombre.localeCompare(b.localNombre, "es");
}

/** Solo rutas aún por hacer / en curso (no completadas ni canceladas). */
function isRutaActiva(route: RouteItem) {
  return !isRecolectado(route.estado) && !isCerrado(route.estado);
}

function withEmuDemo(routes: RouteItem[]) {
  if (routes.length || !esEmuladorAndroid()) return routes;
  return [rutaDemoEmulador()];
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
  const me = useMyLocation();
  const origin = me ? { lat: me.lat, lng: me.lng } : null;
  const originAccuracy = me?.accuracy ?? null;
  const [panelOpen, setPanelOpen] = useState(false);
  const [live, setLive] = useState(false);
  const [fecha, setFecha] = useState(() => limaDate());
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
        const rutas = await fetchOperadorRutas(userId, fecha);
        if (!localesRef.current.length) {
          const cached = peekLocalesCache();
          if (cached?.length) localesRef.current = cached;
        }
        const mine = withEmuDemo(
          enrichRoutesWithLocales(rutas, localesRef.current)
            .filter(isRutaActiva)
            .sort(sortByOrden),
        );

        const nextFp = routesFingerprint(mine);
        if (nextFp !== fingerprintRef.current) {
          fingerprintRef.current = nextFp;
          setRoutes(mine);
          setSelectedId((prev) => {
            if (prev && mine.some((item) => item.id === prev)) return prev;
            const active =
              mine.find((item) => isEnCurso(item.estado)) ??
              mine.find((item) => asEstado(item.estado) === "programado") ??
              mine[0] ??
              null;
            return active?.id ?? null;
          });
        }
        if (!silent) setError(null);
        if (!localesRef.current.length) {
          localesRef.current = await fetchLocales({ includeFotos: false }).catch(() => []);
          if (localesRef.current.length) {
            const enriched = withEmuDemo(
              enrichRoutesWithLocales(rutas, localesRef.current)
                .filter(isRutaActiva)
                .sort(sortByOrden),
            );
            const fp = routesFingerprint(enriched);
            if (fp !== fingerprintRef.current) {
              fingerprintRef.current = fp;
              setRoutes(enriched);
            }
          }
        }
      } catch (err) {
        if (esEmuladorAndroid()) {
          const demo = [rutaDemoEmulador()];
          fingerprintRef.current = routesFingerprint(demo);
          setRoutes(demo);
          setSelectedId("emu-demo-1");
          if (!silent) setError(null);
        } else if (!silent) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar tus rutas");
          setRoutes([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [fecha, userId],
  );

  useEffect(() => {
    void reload(false);
  }, [reload]);

  // Polling silencioso del panel (paridad Flutter Timer.periodic).
  useEffect(() => {
    const timer = setInterval(() => {
      void reload(true);
    }, ROUTES_POLL_MS);
    return () => clearInterval(timer);
  }, [reload]);

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

  const pendientes = routes.filter((item) => asEstado(item.estado) === "programado").length;
  const enCurso = routes.filter((item) => isEnCurso(item.estado)).length;

  const pins = useMemo<CampoMapPin[]>(
    () =>
      routes
        .filter((item) => item.localLatitud != null && item.localLongitud != null)
        .map((item) => ({
          id: item.id,
          lat: item.localLatitud!,
          lng: item.localLongitud!,
          orden: item.orden ?? 0,
          color: pinColorForLocal(item.prioridad),
          label: item.localNombre,
        })),
    [routes],
  );

  const setFechaSafe = useCallback((next: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return;
    setFecha(next);
  }, []);

  return {
    fecha,
    setFecha: setFechaSafe,
    routes,
    loading,
    error,
    selected,
    selectedId,
    setSelectedId,
    origin,
    originAccuracy,
    dest,
    panelOpen,
    setPanelOpen,
    reload: () => reload(false),
    refreshOrigin: async () => undefined,
    pins,
    pendientes,
    enCurso,
    live,
  };
}
