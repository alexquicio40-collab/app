import { localesDelUsuario, seesAllUsers } from "@/lib/scope-user";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InteractionManager } from "react-native";
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
  const { user } = useAuth();
  const [locales, setLocales] = useState<LocalOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [restrictions, setRestrictions] = useState<RestrictionItem[]>([]);
  /** Catálogos ligeros (programación / zonas). */
  const [loading, setLoading] = useState(false);
  /** Lista de locales (payload grande). */
  const [localesLoading, setLocalesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  const loadLocales = useCallback(async (force = false) => {
    setLocalesLoading(true);
    try {
      const locs = await fetchLocales({ force });
      setLocales(seesAllUsers(user?.rol) ? locs : localesDelUsuario(locs, user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los locales");
    } finally {
      setLocalesLoading(false);
    }
  }, [user]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Primero lo liviano → la UI del tab puede montarse.
      const [progs, zones] = await Promise.all([fetchSchedules(), fetchRestrictions()]);
      setSchedules(progs);
      setRestrictions(zones);
      setBooted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar asignaciones");
    } finally {
      setLoading(false);
    }

    // Locales después (o desde cache compartida con Hoja ruta).
    await loadLocales(false);
  }, [loadLocales]);

  useEffect(() => {
    if (!enabled || booted) return;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!cancelled) void reload();
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [enabled, booted, reload]);

  const assignRoute = useCallback(async (input: AssignRouteInput) => {
    await createRoute(input);
  }, []);

  const setRouteOrder = useCallback(async (orderedIds: string[]) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await updateRoute(orderedIds[i]!, { orden: i + 1 });
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

  const saveRestriction = useCallback(
    async (input: RestrictionInput, editId?: number) => {
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
      const zones = await fetchRestrictions();
      setRestrictions(zones);
    },
    [],
  );

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

  const scopedSchedules = useMemo(() => {
    if (seesAllUsers(user?.rol)) return schedules;
    const ids = new Set(locales.map((item) => item.id));
    return schedules.filter((item) => ids.has(item.localId));
  }, [locales, schedules, user?.rol]);

  return {
    locales,
    schedules: scopedSchedules,
    restrictions,
    loading,
    localesLoading,
    error,
    booted,
    reload,
    assignRoute,
    setRouteOrder,
    saveSchedule,
    removeSchedule,
    generateRoutes,
    canGenerate: seesAllUsers(user?.rol),
    saveRestriction,
    toggleRestriction,
    removeRestriction,
  };
}
