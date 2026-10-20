import { canEditarLocal } from "./lib/permisos";
import { loadRestringidos, rememberRestringido } from "./lib/restringidos-store";
import { localesDelUsuario, seesAllUsers } from "@/lib/scope-user";
import { isAdministrador } from "@/lib/role-nav";
import { esEmuladorAndroid, localesDemoEmulador } from "@/lib/emulador";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, InteractionManager, Platform } from "react-native";
import {
  createLocal,
  createMetodoPago,
  deleteLocal,
  deleteMetodoPago,
  extractCreatedLocalId,
  fetchLocales,
  fetchMetodosPago,
  fetchLocalById,
  hydrateLocalFotos,
  invalidateLocalesCaches,
  peekLocalesCache,
  peekLocalesSnap,
  seedLocalesCache,
  syncLocalFotos,
  updateLocal,
  updateLocalCertEstado,
  updateMetodoPago,
  type MetodoPagoOption,
} from "./api";
import {
  collectDistritos,
  countLocales,
  createDefaultLocalFilters,
  hasActiveLocalFilters,
} from "./lib/filters";
import type { LocalFormInput, LocalItem, LocalesFilters } from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

function avisoSoloConsulta() {
  notify(
    "Solo consulta",
    "Este local lo registró otro asesor. Puedes verlo, pero no editarlo ni accionar.",
  );
}

async function confirmDelete(nombre: string) {
  if (Platform.OS === "web") return window.confirm(`¿Eliminar el local "${nombre}"?`);
  return new Promise<boolean>((resolve) => {
    Alert.alert("Eliminar local", `¿Eliminar el local "${nombre}"?`, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function useLocalesScreen() {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const canManage = rol === "administrador" || rol === "asesor";

  const [locales, setLocales] = useState<LocalItem[]>(() => {
    const cached = peekLocalesCache();
    if (cached?.length) return cached;
    if (esEmuladorAndroid()) {
      const demo = localesDemoEmulador();
      seedLocalesCache(demo);
      return demo;
    }
    return [];
  });
  const [metodosPago, setMetodosPago] = useState<MetodoPagoOption[]>([]);
  const [filters, setFilters] = useState<LocalesFilters>(createDefaultLocalFilters);
  const [loading, setLoading] = useState(() => {
    if (peekLocalesCache()?.length) return false;
    return !esEmuladorAndroid();
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [metodosOpen, setMetodosOpen] = useState(false);
  const [metodosSaving, setMetodosSaving] = useState(false);

  const applyRows = useCallback(
    (rows: LocalItem[], restrictedIds?: Set<string>) => {
      const scoped = localesDelUsuario(rows, user);
      if (!restrictedIds || restrictedIds.size === 0) {
        setLocales(scoped);
        return;
      }
      setLocales(
        scoped.map((item) =>
          item.restringido || restrictedIds.has(item.id)
            ? { ...item, restringido: true }
            : item,
        ),
      );
    },
    [user],
  );

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "boot") {
      const cached = peekLocalesCache();
      if (cached?.length) {
        applyRows(cached);
        setLoading(false);
      } else if (esEmuladorAndroid()) {
        const demo = localesDemoEmulador();
        seedLocalesCache(demo);
        applyRows(demo);
        setLoading(false);
      } else {
        const snap = await peekLocalesSnap();
        if (snap?.length) {
          seedLocalesCache(snap);
          applyRows(snap);
          setLoading(false);
        } else {
          setLoading(true);
        }
      }
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const [rows, restrictedIds] = await Promise.all([
        fetchLocales({
          force: mode === "refresh",
          includeFotos: false,
          onPartial: (partial) => {
            applyRows(partial);
            setLoading(false);
          },
        }),
        loadRestringidos(),
      ]);
      const paint = () => {
        applyRows(rows, restrictedIds);
        setError(null);
      };
      if (mode === "boot" && peekLocalesCache()?.length) {
        InteractionManager.runAfterInteractions(paint);
      } else {
        paint();
      }
    } catch (err) {
      if (esEmuladorAndroid()) {
        const demo = localesDemoEmulador();
        seedLocalesCache(demo);
        applyRows(demo);
        setError(null);
      } else if (mode !== "boot" || !peekLocalesCache()?.length) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los locales");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    // Métodos de pago no bloquean la pantalla.
    void fetchMetodosPago()
      .then(setMetodosPago)
      .catch(() => setMetodosPago([]));
  }, [applyRows]);

  useEffect(() => {
    void load("boot");
  }, [load]);

  const enrichLocal = useCallback((id: string) => {
    setLocales((prev) =>
      prev.map((item) => (item.id === id ? hydrateLocalFotos(item) : item)),
    );
    void fetchLocalById(id)
      .then((full) => {
        if (!full) return;
        setLocales((prev) => prev.map((item) => (item.id === id ? full : item)));
      })
      .catch(() => undefined);
  }, []);

  const openLocal = useCallback(
    (id: string | null) => {
      if (!id) {
        setSelectedId(null);
        return;
      }
      enrichLocal(id);
      setSelectedId(id);
    },
    [enrichLocal],
  );

  const openEdit = useCallback(
    (id: string) => {
      const local = locales.find((item) => item.id === id);
      if (local && !canEditarLocal(local, user)) {
        avisoSoloConsulta();
        return;
      }
      enrichLocal(id);
      setCreating(false);
      setEditingId(id);
    },
    [enrichLocal, locales, user],
  );

  const kpiCounts = useMemo(() => countLocales(locales), [locales]);
  const counts = kpiCounts;
  const distritos = useMemo(() => collectDistritos(), []);

  const selected = useMemo(
    () =>
      locales.find((item) => item.id === selectedId) ??
      null,
    [locales, selectedId],
  );

  const editing = useMemo(
    () => (editingId ? locales.find((item) => item.id === editingId) ?? null : null),
    [editingId, locales],
  );

  const patchFilters = useCallback((patch: Partial<LocalesFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(createDefaultLocalFilters());
  }, []);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setCreating(true);
  }, []);

  const closeForm = useCallback(() => {
    setCreating(false);
    setEditingId(null);
  }, []);

  const saveLocal = useCallback(
    async (input: LocalFormInput) => {
      const { pendingFotos = [], removedFotoIds = [], ...payload } = input;
      if (editingId) {
        const current = locales.find((item) => item.id === editingId);
        if (current && !canEditarLocal(current, user)) {
          avisoSoloConsulta();
          return;
        }
      }
      const stamped = {
        ...payload,
        restringido: isAdministrador(rol) ? Boolean(payload.restringido) : false,
        asesorBioClim: seesAllUsers(rol)
          ? payload.asesorBioClim
          : user?.name || user?.username || payload.asesorBioClim,
      };
      setMutating(true);
      try {
        let localId = editingId ?? "";
        if (editingId) {
          await updateLocal(editingId, stamped);
        } else {
          const created = await createLocal(stamped);
          localId = extractCreatedLocalId(created);
          if (!localId) {
            throw new Error("Local creado pero sin ID para subir fotos");
          }
        }

        if (localId) {
          await rememberRestringido(localId, Boolean(stamped.restringido));
        }
        if (localId && (pendingFotos.length || removedFotoIds.length)) {
          await syncLocalFotos(localId, pendingFotos, removedFotoIds);
        }

        notify("Listo", editingId ? "Local actualizado" : "Local creado");
        closeForm();
        invalidateLocalesCaches();
        await load("refresh");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo guardar");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [editingId, closeForm, load, rol, user, locales],
  );

  const removeLocal = useCallback(
    async (local: LocalItem) => {
      if (!canEditarLocal(local, user)) {
        avisoSoloConsulta();
        return;
      }
      const ok = await confirmDelete(local.nombre);
      if (!ok) return;
      setMutating(true);
      try {
        await deleteLocal(local.id);
        invalidateLocalesCaches();
        setLocales((prev) => prev.filter((item) => item.id !== local.id));
        setSelectedId((prev) => (prev === local.id ? null : prev));
        notify("Listo", "Local eliminado");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
      } finally {
        setMutating(false);
      }
    },
    [rol, user],
  );

  const toggleCertEstado = useCallback(async (local: LocalItem) => {
    if (!local.necesitaCertificacion) return;
    if (!canEditarLocal(local, user)) {
      avisoSoloConsulta();
      return;
    }
    const next = local.estadoCertificacion === "pendiente" ? "ya emitido" : "pendiente";
    setMutating(true);
    try {
      await updateLocalCertEstado(local.id, next);
      setLocales((prev) =>
        prev.map((item) =>
          item.id === local.id ? { ...item, estadoCertificacion: next } : item,
        ),
      );
      notify("Listo", next === "ya emitido" ? "Certificado marcado" : "Vuelve a pendiente");
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setMutating(false);
    }
  }, [user]);

  const setCertFilter = useCallback((value: "necesita" | "no_necesita" | null) => {
    setFilters((prev) => ({ ...prev, certificacion: value }));
  }, []);

  const reloadMetodos = useCallback(async () => {
    const metodos = await fetchMetodosPago().catch(() => [] as MetodoPagoOption[]);
    setMetodosPago(metodos);
  }, []);

  const addMetodoPago = useCallback(
    async (nombre: string) => {
      setMetodosSaving(true);
      try {
        await createMetodoPago(nombre);
        await reloadMetodos();
        notify("Listo", "Forma de pago agregada");
      } finally {
        setMetodosSaving(false);
      }
    },
    [reloadMetodos],
  );

  const renameMetodoPago = useCallback(
    async (id: number, nombre: string) => {
      setMetodosSaving(true);
      try {
        await updateMetodoPago(id, { nombre });
        await Promise.all([reloadMetodos(), load("refresh")]);
        notify("Listo", "Forma de pago actualizada");
      } finally {
        setMetodosSaving(false);
      }
    },
    [reloadMetodos, load],
  );

  const removeMetodoPago = useCallback(
    async (item: MetodoPagoOption) => {
      const ok =
        Platform.OS === "web"
          ? window.confirm(
              `¿Eliminar "${item.nombre}"?\nSe quitará de los locales que lo tengan asignado.`,
            )
          : await new Promise<boolean>((resolve) => {
              Alert.alert(
                "¿Eliminar forma de pago?",
                `Se eliminará "${item.nombre}" y se quitará de los locales que lo tengan asignado.`,
                [
                  { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                  { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
                ],
              );
            });
      if (!ok) return;
      setMetodosSaving(true);
      try {
        await deleteMetodoPago(item.id);
        await Promise.all([reloadMetodos(), load("refresh")]);
        notify("Listo", "Forma de pago eliminada");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
      } finally {
        setMetodosSaving(false);
      }
    },
    [reloadMetodos, load],
  );

  return {
    loading,
    refreshing,
    error,
    locales,
    filtered: locales,
    counts,
    kpiCounts,
    distritos,
    metodosPago,
    filters,
    patchFilters,
    clearFilters,
    setCertFilter,
    hasFilters: hasActiveLocalFilters(filters),
    selected,
    editing,
    creating,
    formOpen: creating || editingId != null,
    mutating,
    canManage,
    canRestrict: isAdministrador(rol),
    ownerName: user?.name || user?.username || "",
    lockAsesor: !seesAllUsers(rol),
    metodosOpen,
    metodosSaving,
    openMetodos: () => setMetodosOpen(true),
    closeMetodos: () => setMetodosOpen(false),
    addMetodoPago,
    renameMetodoPago,
    removeMetodoPago,
    openLocal,
    closeLocal: () => setSelectedId(null),
    openCreate,
    openEdit,
    closeForm,
    saveLocal,
    removeLocal,
    toggleCertEstado,
    reload: () => load("refresh"),
  };
}
