import { isOnRoute, timeAgo, useLiveMap } from "@/features/map/hooks";
import type { LiveOperator } from "@/features/map/types";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform, Share } from "react-native";
import { fetchOperatorRoutes, shareRouteLink } from "./api";
import type { OperatorDetailState, OperatorRouteDetail } from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function copyText(value: string) {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }
  await Share.share({ message: value });
}

function stopsKeyFor(operatorId: number, stops: { operatorId: number; id: number; estado: string }[]) {
  return stops
    .filter((item) => item.operatorId === operatorId)
    .map((item) => `${item.id}:${item.estado}`)
    .join("|");
}

function routesKey(routes: OperatorRouteDetail[]) {
  return routes.map((item) => `${item.id}:${item.estado}`).join("|");
}

export function useOperadoresScreen() {
  const { user } = useAuth();
  const map = useLiveMap();
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<OperatorDetailState | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cajaOpen, setCajaOpen] = useState(false);
  const detailIdRef = useRef<number | null>(null);
  const lastStopsKeyRef = useRef("");

  const canAssignCaja = (user?.rol ?? "").toLowerCase() === "administrador";
  const isAdmin = canAssignCaja;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return map.operators;
    return map.operators.filter((item) => item.name.toLowerCase().includes(q));
  }, [map.operators, query]);

  const refreshDetailRoutes = useCallback(async (operatorId: number, silent = true) => {
    if (!silent) setDetailLoading(true);
    try {
      const routes = await fetchOperatorRoutes(operatorId);
      setDetail((prev) => {
        if (!prev || prev.operatorId !== operatorId) return prev;
        if (routesKey(prev.routes) === routesKey(routes)) return prev;
        return { ...prev, routes };
      });
    } catch {
      // en refresh silencioso no molestamos
    } finally {
      if (!silent) setDetailLoading(false);
    }
  }, []);

  const openDetail = useCallback(
    async (operator: LiveOperator) => {
      detailIdRef.current = operator.id;
      lastStopsKeyRef.current = "";
      map.setSelectedId(operator.id);
      setDetailLoading(true);
      setDetail({
        operatorId: operator.id,
        operatorName: operator.name,
        speed: operator.speed,
        timestamp: operator.timestamp,
        onRoute: isOnRoute(operator),
        routes: [],
      });
      try {
        const routes = await fetchOperatorRoutes(operator.id);
        if (detailIdRef.current !== operator.id) return;
        setDetail((prev) =>
          prev && prev.operatorId === operator.id
            ? { ...prev, routes, speed: operator.speed, timestamp: operator.timestamp }
            : prev,
        );
      } catch (err) {
        notify("Detalle", err instanceof Error ? err.message : "No se pudieron cargar las rutas");
      } finally {
        if (detailIdRef.current === operator.id) setDetailLoading(false);
      }
    },
    [map.setSelectedId],
  );

  const closeDetail = useCallback(() => {
    detailIdRef.current = null;
    lastStopsKeyRef.current = "";
    setDetail(null);
    setDetailLoading(false);
  }, []);

  // Sync velocidad / estado en vivo mientras el sheet está abierto.
  useEffect(() => {
    if (!detail) return;
    const liveOp = map.operators.find((item) => item.id === detail.operatorId);
    if (!liveOp) return;
    setDetail((prev) => {
      if (!prev || prev.operatorId !== liveOp.id) return prev;
      if (
        prev.speed === liveOp.speed &&
        prev.timestamp === liveOp.timestamp &&
        prev.onRoute === isOnRoute(liveOp)
      ) {
        return prev;
      }
      return {
        ...prev,
        speed: liveOp.speed,
        timestamp: liveOp.timestamp,
        onRoute: isOnRoute(liveOp),
        operatorName: liveOp.name || prev.operatorName,
      };
    });
  }, [detail, map.operators]);

  // Cuando el snapshot live cambia las paradas del operador → refrescar rutas del panel.
  useEffect(() => {
    if (!detail) return;
    const key = stopsKeyFor(detail.operatorId, map.data.stops);
    if (key === lastStopsKeyRef.current) return;
    lastStopsKeyRef.current = key;
    void refreshDetailRoutes(detail.operatorId, true);
  }, [detail, map.data.stops, refreshDetailRoutes]);

  const selectOperator = useCallback(
    (id: number) => {
      map.setSelectedId(id);
    },
    [map.setSelectedId],
  );

  const shareRoute = useCallback(async (route: OperatorRouteDetail) => {
    try {
      const url = await shareRouteLink(route.id);
      await copyText(url);
      notify("Compartir", "Enlace copiado. Ya puedes enviarlo.");
    } catch (err) {
      notify("Compartir", err instanceof Error ? err.message : "No se pudo generar el enlace");
    }
  }, []);

  const callPhone = useCallback(async (phone: string) => {
    const clean = phone.replace(/[^\d+]/g, "");
    if (!clean) {
      notify("Llamar", "No hay teléfono disponible");
      return;
    }
    const url = `tel:${clean}`;
    const can = await Linking.canOpenURL(url).catch(() => Platform.OS === "web");
    if (!can && Platform.OS !== "web") {
      notify("Llamar", "No se puede abrir el marcador");
      return;
    }
    await Linking.openURL(url);
  }, []);

  const focusRoute = useCallback(
    (route: OperatorRouteDetail) => {
      if (detail) map.setSelectedId(detail.operatorId);
      if (route.latitud == null || route.longitud == null) {
        notify("Cómo llegar", "Este local no tiene coordenadas");
        return;
      }
      closeDetail();
    },
    [closeDetail, detail, map.setSelectedId],
  );

  return {
    map,
    query,
    setQuery,
    filtered,
    onlineLabel: `${map.online} en línea`,
    detail,
    detailLoading,
    openDetail,
    closeDetail,
    selectOperator,
    shareRoute,
    callPhone,
    focusRoute,
    cajaOpen,
    setCajaOpen,
    canAssignCaja,
    isAdmin,
    timeAgo,
    isOnRoute,
  };
}
