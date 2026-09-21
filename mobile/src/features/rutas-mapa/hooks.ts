import { limaDate } from "@/lib/api";
import { fetchConductores, fetchRoutes } from "@/features/routes/api";
import type { ConductorOption, RouteItem } from "@/features/routes/types";
import { buildConductorColorMap } from "./lib/colors";
import { hasCoords, sortByOrden } from "./lib/format";
import type { RutasMapaPayload } from "./types";
import { useCallback, useEffect, useMemo, useState } from "react";

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useRutasMapaScreen() {
  const [fecha, setFecha] = useState(limaDate);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [rutas, setRutas] = useState<RouteItem[]>([]);
  const [selectedConductorId, setSelectedConductorId] = useState<string | null>(null);
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colorByConductor = useMemo(
    () => buildConductorColorMap(conductores.map((item) => item.id)),
    [conductores],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ops, rows] = await Promise.all([
        fetchConductores(),
        fetchRoutes({ fecha }),
      ]);
      setConductores(ops);
      setRutas(rows);
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
      color: colorByConductor.get(item.conductorId) ?? "#1976D2",
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
    };
  }, [filtered, selectedConductorId, selectedRutaId, colorByConductor]);

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
