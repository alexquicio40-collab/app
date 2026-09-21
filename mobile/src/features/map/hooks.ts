import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mapLiveRequest } from "./api";
import { MIN_MOVE, POLL_MS, SOCKET_COALESCE_MS, SOCKET_KEEP_MS } from "./constants";
import { connectLiveSocket } from "./socket";
import type { LiveOperator, MapFilter, MapLive } from "./types";

const EMPTY: MapLive = { operators: [], stops: [], catalog: [] };

function mergeSnapshot(prev: MapLive, next: MapLive): MapLive {
  const byId = new Map(next.operators.map((item) => [item.id, item]));
  const now = Date.now();

  for (const current of prev.operators) {
    const incoming = byId.get(current.id);
    const currentTs = new Date(current.timestamp).getTime();

    if (!incoming) {
      // Conserva patches de socket recientes si el poll aún no los trae.
      if (now - currentTs < SOCKET_KEEP_MS) byId.set(current.id, current);
      continue;
    }

    if (currentTs > new Date(incoming.timestamp).getTime()) {
      byId.set(current.id, {
        ...incoming,
        ...current,
        name: incoming.name || current.name,
      });
    }
  }

  return {
    operators: [...byId.values()],
    stops: next.stops,
    catalog: next.catalog.length ? next.catalog : prev.catalog,
  };
}

export function useLiveMap() {
  const { user } = useAuth();
  const [data, setData] = useState<MapLive>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MapFilter>("todos");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  const namesRef = useRef(new Map<number, string>());
  const operatorsRef = useRef<LiveOperator[]>([]);
  const patchesRef = useRef(new Map<number, LiveOperator | null>());
  const coalesceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rememberNames = (items: { id: number; name: string }[]) => {
    for (const item of items) {
      if (item.name) namesRef.current.set(item.id, item.name);
    }
  };

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const snapshot = await mapLiveRequest();
      rememberNames(snapshot.catalog);
      rememberNames(snapshot.operators);
      setData((prev) => {
        const merged = mergeSnapshot(prev, snapshot);
        operatorsRef.current = merged.operators;
        return merged;
      });
    } catch {
      if (!silent) {
        setData(EMPTY);
        operatorsRef.current = [];
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const flushPatches = useCallback(() => {
    coalesceRef.current = null;
    const patches = patchesRef.current;
    if (patches.size === 0) return;
    patchesRef.current = new Map();

    setData((prev) => {
      const byId = new Map(prev.operators.map((item) => [item.id, item]));
      patches.forEach((patch, id) => {
        if (!patch) {
          byId.delete(id);
          return;
        }
        byId.set(id, patch);
      });
      const operators = [...byId.values()];
      operatorsRef.current = operators;
      return { ...prev, operators };
    });
  }, []);

  const queuePatch = useCallback(
    (id: number, next: LiveOperator | null) => {
      patchesRef.current.set(id, next);
      if (coalesceRef.current) return;
      coalesceRef.current = setTimeout(flushPatches, SOCKET_COALESCE_MS);
    },
    [flushPatches],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const timer = setInterval(() => reload(true), POLL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectLiveSocket(String(user.id), {
      onConnect: () => setLive(true),
      onDisconnect: () => setLive(false),
      onRouteChanged: () => {
        void reload(true);
      },
      onLocation: (patch) => {
        const current = operatorsRef.current.find((item) => item.id === patch.userId);

        if (current) {
          const dLat = patch.latitude - current.latitude;
          const dLng = patch.longitude - current.longitude;
          const speedDelta = Math.abs((current.speed ?? 0) - patch.speed);
          if (dLat * dLat + dLng * dLng < MIN_MOVE && speedDelta < 1) return;
        }

        queuePatch(patch.userId, {
          id: patch.userId,
          name: current?.name || namesRef.current.get(patch.userId) || "Operador",
          latitude: patch.latitude,
          longitude: patch.longitude,
          speed: patch.speed,
          timestamp: new Date().toISOString(),
          estado: current?.estado === "activo" ? "activo" : "en_linea",
        });
      },
      onOffline: (id) => queuePatch(id, null),
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setLive(false);
    };
  }, [queuePatch, reload, user?.id]);

  useEffect(() => {
    return () => {
      if (coalesceRef.current) clearTimeout(coalesceRef.current);
    };
  }, []);

  const operators = useMemo(() => {
    if (filter === "en_linea") return data.operators.filter((item) => item.estado === "en_linea");
    if (filter === "en_ruta") return data.operators.filter((item) => item.estado === "activo");
    return data.operators;
  }, [data.operators, filter]);

  const selected = operators.find((item) => item.id === selectedId) ?? null;

  return {
    data,
    operators,
    loading,
    filter,
    setFilter,
    selected,
    selectedId,
    setSelectedId,
    reload,
    live,
    online: data.operators.filter((item) => item.estado === "en_linea").length,
    onRoute: data.operators.filter((item) => item.estado === "activo").length,
  };
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Ahora";
  if (mins === 1) return "Hace 1 min";
  return `Hace ${mins} min`;
}

export function isOnRoute(operator: LiveOperator) {
  return operator.estado === "activo";
}
