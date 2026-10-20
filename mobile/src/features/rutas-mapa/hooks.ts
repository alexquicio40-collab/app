import { fetchLocales, peekLocalesCache } from "@/features/locales/api";
import { pinColorForLocal } from "@/features/locales/lib/prioridad";
import { limaDate } from "@/lib/api";
import { fetchConductores, fetchRoutes } from "@/features/routes/api";
import { enrichRoutesWithLocales } from "@/features/routes/lib/enrich";
import type { ConductorOption, RouteItem } from "@/features/routes/types";
import { buildConductorColorMap } from "./lib/colors";
import { hasCoords, sortByOrden } from "./lib/format";
import { useMyLocation } from "@/features/map/lib/use-my-location";
import type { RutasMapaPayload } from "./types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useRutasMapaScreen() {
  const me = useMyLocation();
  const [fecha, setFecha] = useState(limaDate);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [rutas, setRutas] = useState<RouteItem[]>([]);
  const [selectedConductorId, setSelectedConductorId] = useState<string | null>(null);
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localesRef = useRef<Awaited<ReturnType<typeof fetchLocales>>>([]);

  const colorByConductor = useMemo(
    () => buildConductorColorMap(conductores.map((item) => item.id)),
    [conductores],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!localesRef.current.length) {
        const cached = peekLocalesCache();
        if (cached?.length) localesRef.current = cached;
      }
      const [ops, rows] = await Promise.all([
        fetchConductores(),
        fetchRoutes({ fecha }),
      ]);
      setConductores(ops);
      setRutas(enrichRoutesWithLocales(rows, localesRef.current));
      setLoading(false);
      if (!localesRef.current.length) {
        localesRef.current = await fetchLocales({ includeFotos: false }).catch(() => []);
        setRutas(enrichRoutesWithLocales(rows, localesRef.current));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las rutas");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    void load();
  }, [load]);

  const countByConductor = useMemo(() => {
    const map = new Map<string, number>();
    for (const ruta of rutas) {
      if (!ruta.conductorId) continue;
      map.set(ruta.conductorId, (map.get(ruta.conductorId) ?? 0) + 1);
    }
    return map;
  }, [rutas]);

  const filtered = useMemo(() => {
    const base = selectedConductorId
      ? rutas.filter((item) => item.conductorId === selectedConductorId)
      : rutas;
    return base.filter(hasCoords).slice().sort(sortByOrden);
  }, [rutas, selectedConductorId]);

  const selectedRuta = useMemo(
    () => rutas.find((item) => item.id === selectedRutaId) ?? null,
    [rutas, selectedRutaId],
  );

  const mapPayload: RutasMapaPayload = useMemo(() => {
    const pins = filtered.map((item) => ({
      id: item.id,
      lat: item.localLatitud!,
      lng: item.localLongitud!,
      orden: item.orden ?? 0,
      color: pinColorForLocal(item.prioridad),
      label: item.localNombre,
    }));

    const path =
      selectedConductorId && filtered.length > 1
        ? filtered.map((item) => ({ lat: item.localLatitud!, lng: item.localLongitud! }))
        : null;

    return {
      pins,
      path,
      pathColor: selectedConductorId
        ? colorByConductor.get(selectedConductorId) ?? "#1976D2"
        : null,
      selectedId: selectedRutaId,
      me,
    };
  }, [filtered, selectedConductorId, selectedRutaId, colorByConductor, me]);

  const setFechaDate = useCallback((date: Date) => {
    setFecha(toIsoDate(date));
    setSelectedRutaId(null);
  }, []);

  const selectConductor = useCallback((id: string | null) => {
    setSelectedConductorId(id);
    setSelectedRutaId(null);
  }, []);

  return {
    fecha,
    setFechaDate,
    conductores,
    countByConductor,
    colorByConductor,
    totalRutas: rutas.length,
    filteredCount: filtered.length,
    selectedConductorId,
    selectConductor,
    selectedRutaId,
    setSelectedRutaId,
    selectedRuta,
    mapPayload,
    loading,
    error,
    reload: load,
  };
}
