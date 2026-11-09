import { fetchLocales as fetchLocalesFull, peekLocalesCache } from "@/features/locales/api";
import type { LocalItem } from "@/features/locales/types";
import { isRolCampo, localesDelUsuario, rutaDelUsuario } from "@/lib/scope-user";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  defaultRoutesFecha,
  deleteRoute,
  fetchConductores,
  fetchRoutes,
  peekRoutes,
  updateRoute,
  type UpdateRouteInput,
} from "./api";
import { fetchLocales } from "./assign/api";
import type { LocalOption } from "./assign/types";
import {
  collectDistritos,
  countByEstado,
  createDefaultFilters,
  filterRoutes,
  hasActiveFilters,
} from "./lib/filters";
import { loadFechaAsignacion, rememberFechaAsignacion } from "./lib/fecha-asignacion-store";
import { enrichRoutesWithLocales } from "./lib/enrich";
import type { ConductorOption, RouteItem, RoutesFilters } from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function confirmDelete(routeName: string) {
  if (Platform.OS === "web") {
    return window.confirm(`¿Eliminar la ruta de "${routeName}"?`);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert("Eliminar ruta", `¿Eliminar la ruta de "${routeName}"?`, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function useRoutesScreen() {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const isOperador = rol === "operador" || rol === "conductor" || rol === "chofer";
  const userId = user?.id != null ? String(user.id) : null;

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [locales, setLocales] = useState<LocalOption[]>([]);
  const [filters, setFilters] = useState<RoutesFilters>(createDefaultFilters);
  const [loading, setLoading] = useState(() => !peekRoutes({ fecha: defaultRoutesFecha() }));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const driversLoaded = useRef(false);
  const localesLoaded = useRef(false);
  const localesFullRef = useRef<LocalItem[]>([]);
  const localesFullLoaded = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (mode: "boot" | "refresh" | "filter" = "boot", nextFilters?: RoutesFilters) => {
      const active = nextFilters ?? filters;
      const id = ++requestId.current;

      const fechaDesde = active.fechaDesde ?? defaultRoutesFecha();
      const fechaHasta = active.fechaHasta ?? active.fechaDesde ?? defaultRoutesFecha();
      const cached = peekRoutes({
        fecha: fechaDesde === fechaHasta ? fechaDesde : undefined,
        conductorId: active.conductorId,
        estado: active.estado,
      });
      if (cached) {
        setRoutes(enrichRoutesWithLocales(cached, localesFullRef.current));
        setLoading(false);
      }
      if ((mode === "boot" || mode === "filter") && !cached) setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);

      try {
        const routesPromise = fetchRoutes({
          fechaDesde,
          fechaHasta,
          conductorId: active.conductorId,
          estado: active.estado,
        });

        const driversPromise = driversLoaded.current
          ? Promise.resolve(null)
          : fetchConductores();

        const cachedLocales = peekLocalesCache();
        if (!localesFullLoaded.current && cachedLocales?.length) {
          localesFullRef.current = cachedLocales;
          localesFullLoaded.current = true;
        }

        const [rutas, drivers] = await Promise.all([routesPromise, driversPromise]);
        if (id !== requestId.current) return;

        const paint = (catalog: LocalItem[]) => {
          const mine = localesDelUsuario(catalog, user);
          const localIds = new Set(mine.map((item) => item.id));
          const scoped = isRolCampo(user?.rol)
            ? rutas
            : rutas.filter((item) => rutaDelUsuario(item, user, localIds));
          setRoutes(enrichRoutesWithLocales(scoped, catalog));
        };
        paint(localesFullRef.current);
        if (drivers) {
          driversLoaded.current = true;
          setConductores(drivers);
        }
        setLoading(false);
        setRefreshing(false);

        if (!localesFullLoaded.current) {
          const localesFull = await fetchLocalesFull({ includeFotos: false }).catch(
            () => [] as LocalItem[],
          );
          if (id !== requestId.current) return;
          localesFullRef.current = localesFull;
          localesFullLoaded.current = true;
          paint(localesFull);
        }
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar las rutas");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filters, isOperador, userId, user],
  );

  useEffect(() => {
    let alive = true;
    const boot = async () => {
      if (isOperador) {
        await load("boot");
        return;
      }
      const saved = await loadFechaAsignacion();
      if (!alive) return;
      const next = {
        ...createDefaultFilters(),
        fechaDesde: saved,
        fechaHasta: saved,
      };
      setFilters(next);
      await load("boot", next);
    };
    void boot();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOperador, userId]);

  const ensureLocales = useCallback(async () => {
    if (localesLoaded.current) return;
    const rows = await fetchLocales();
    setLocales(rows);
    localesLoaded.current = true;
  }, []);

  const patchRouteLocal = useCallback((id: string, patch: Partial<RouteItem>) => {
    setRoutes((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeRouteLocal = useCallback((id: string) => {
    setRoutes((prev) => prev.filter((item) => item.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const openEdit = useCallback(
    async (id: string) => {
      try {
        await ensureLocales();
        setEditingId(id);
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudieron cargar locales");
      }
    },
    [ensureLocales],
  );

  const saveEdit = useCallback(
    async (payload: UpdateRouteInput & { conductorId: string; localId: string }) => {
      if (!editingId) return;
      setMutating(true);
      try {
        await updateRoute(editingId, payload);
        const conductorNombre =
          conductores.find((item) => item.id === payload.conductorId)?.nombre;
        const local = locales.find((item) => item.id === payload.localId);
        const next: Partial<RouteItem> = {
          conductorId: payload.conductorId,
          localId: payload.localId,
          fechaAsignacion: payload.fechaAsignacion,
          observaciones: payload.observaciones ?? "",
        };
        if (conductorNombre) next.conductorNombre = conductorNombre;
        if (local) {
          next.localNombre = local.nombre;
          next.localDireccion = local.direccion;
        }
        patchRouteLocal(editingId, next);
        setEditingId(null);
        notify("Listo", "Ruta actualizada");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo actualizar");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [editingId, conductores, locales, patchRouteLocal],
  );

  const changeStatus = useCallback(
    async (estado: string) => {
      if (!statusId) return;
      setMutating(true);
      try {
        await updateRoute(statusId, { estado });
        patchRouteLocal(statusId, { estado });
        setStatusId(null);
        notify("Listo", "Estado actualizado");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo cambiar el estado");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [statusId, patchRouteLocal],
  );

  const removeRoute = useCallback(
    async (route: RouteItem) => {
      const ok = await confirmDelete(route.localNombre);
      if (!ok) return;
      setMutating(true);
      try {
        await deleteRoute(route.id);
        removeRouteLocal(route.id);
        notify("Listo", "Ruta eliminada");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
      } finally {
        setMutating(false);
      }
    },
    [removeRouteLocal],
  );

  const distritos = useMemo(() => collectDistritos(routes), [routes]);
  const filtered = useMemo(() => filterRoutes(routes, filters), [routes, filters]);
  const counts = useMemo(() => countByEstado(filtered), [filtered]);

  const findRoute = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return filtered.find((item) => item.id === id) ?? routes.find((item) => item.id === id) ?? null;
    },
    [filtered, routes],
  );

  const selected = findRoute(selectedId);
  const editing = findRoute(editingId);
  const statusRoute = findRoute(statusId);

  const patchFilters = useCallback(
    (patch: Partial<RoutesFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };

        if (patch.fechaDesde === null && patch.fechaHasta === null) {
          const today = defaultRoutesFecha();
          next.fechaDesde = today;
          next.fechaHasta = today;
        }

        const serverKeysChanged =
          patch.fechaDesde !== undefined ||
          patch.fechaHasta !== undefined ||
          patch.conductorId !== undefined ||
          patch.estado !== undefined;

        if (next.fechaDesde && (patch.fechaDesde !== undefined || patch.fechaHasta !== undefined) && !isOperador) {
          void rememberFechaAsignacion(next.fechaDesde);
        }

        if (serverKeysChanged) {
          queueMicrotask(() => {
            void load("filter", next);
          });
        }
        return next;
      });
    },
    [load, isOperador],
  );

  const clearFilters = useCallback(() => {
    const next = createDefaultFilters();
    setFilters(next);
    void load("filter", next);
  }, [load]);

  return {
    loading,
    refreshing,
    error,
    routes,
    filtered,
    counts,
    conductores,
    locales,
    distritos,
    filters,
    patchFilters,
    clearFilters,
    hasFilters: hasActiveFilters(filters),
    selected,
    editing,
    statusRoute,
    mutating,
    openRoute: setSelectedId,
    closeRoute: () => setSelectedId(null),
    openEdit,
    closeEdit: () => setEditingId(null),
    saveEdit,
    openStatus: setStatusId,
    closeStatus: () => setStatusId(null),
    changeStatus,
    removeRoute,
    reload: () => load("refresh"),
    isOperador,
    userId,
  };
}
