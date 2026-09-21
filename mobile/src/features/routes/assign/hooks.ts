import { useCallback, useEffect, useState } from "react";
import {
  createRestriction,
  createRoute,
  createSchedule,
  deleteRestriction,
  deleteSchedule,
  fetchLocales,
  fetchRestrictions,
  fetchSchedules,
  generateScheduledRoutes,
  updateRestriction,
  updateRoute,
  updateSchedule,
} from "./api";
import type {
  AssignRouteInput,
  LocalOption,
  RestrictionInput,
  RestrictionItem,
  ScheduleInput,
  ScheduleItem,
} from "./types";

type AssignWorkspaceOptions = {
  /** Si false, no carga catálogos hasta que se active (acelera el Listado). */
  enabled?: boolean;
};

export function useAssignWorkspace({ enabled = true }: AssignWorkspaceOptions = {}) {
  const [locales, setLocales] = useState<LocalOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [restrictions, setRestrictions] = useState<RestrictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [locs, progs, zones] = await Promise.all([
        fetchLocales(),
        fetchSchedules(),
        fetchRestrictions(),
      ]);
      setLocales(locs);
      setSchedules(progs);
      setRestrictions(zones);
      setBooted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar asignaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || booted) return;
    void reload();
  }, [enabled, booted, reload]);

  const assignRoute = useCallback(async (input: AssignRouteInput) => {
    await createRoute(input);
  }, []);

  const setRouteOrder = useCallback(async (orderedIds: string[]) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await updateRoute(orderedIds[i], { orden: i + 1 });
    }
  }, []);

  const saveSchedule = useCallback(async (input: ScheduleInput, editId?: number) => {
    if (editId != null) await updateSchedule(editId, input);
    else await createSchedule(input);
  }, []);

  const removeSchedule = useCallback(async (id: number) => {
    await deleteSchedule(id);
    setSchedules((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const generateRoutes = useCallback(async (desde: string, hasta: string) => {
    return generateScheduledRoutes(desde, hasta);
  }, []);

  const saveRestriction = useCallback(async (input: RestrictionInput, editId?: number) => {
    if (editId != null) {
      await updateRestriction(editId, {
        tipo_vehiculo: input.tipoVehiculo,
        tipo_via: "via",
        nombre: input.nombre,
        min_lat: input.minLat,
        max_lat: input.maxLat,
        min_lng: input.minLng,
        max_lng: input.maxLng,
      });
    } else {
      await createRestriction(input);
    }
    await reload();
  }, [reload]);

  const toggleRestriction = useCallback(async (item: RestrictionItem) => {
    await updateRestriction(item.id, { activo: item.activo ? 0 : 1 });
    setRestrictions((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, activo: !row.activo } : row)),
    );
  }, []);

  const removeRestriction = useCallback(async (id: number) => {
    await deleteRestriction(id);
    setRestrictions((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    locales,
    schedules,
    restrictions,
    loading,
    error,
    reload,
    assignRoute,
    setRouteOrder,
    saveSchedule,
    removeSchedule,
    generateRoutes,
    saveRestriction,
    toggleRestriction,
    removeRestriction,
  };
}
