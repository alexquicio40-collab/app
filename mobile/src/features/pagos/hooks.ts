import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import {
  deleteComprobante,
  fetchComprobantes,
  fetchHojasFinalizadas,
  uploadComprobante,
} from "./api";
import {
  createDefaultPagosFilters,
  filterHojasClient,
  hasActivePagosFilters,
} from "./lib/format";
import type {
  ComprobantePago,
  ComprobanteUploadInput,
  HojaPago,
  PagosFilters,
  PagosTab,
} from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function confirmDelete() {
  if (Platform.OS === "web") return window.confirm("¿Eliminar este comprobante?");
  return new Promise<boolean>((resolve) => {
    Alert.alert("Eliminar comprobante", "¿Eliminar este comprobante?", [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function usePagosScreen() {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const canAccess = rol === "administrador";
  const canMutate = rol === "administrador" || rol === "asesor";

  const [tab, setTab] = useState<PagosTab>("pendientes");
  const [hojas, setHojas] = useState<HojaPago[]>([]);
  const [filters, setFilters] = useState<PagosFilters>(createDefaultPagosFilters);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [detail, setDetail] = useState<HojaPago | null>(null);
  const [comprobantes, setComprobantes] = useState<ComprobantePago[]>([]);
  const [compsLoading, setCompsLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewer, setViewer] = useState<ComprobantePago | null>(null);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (mode: "boot" | "refresh" | "silent" = "boot") => {
    if (mode === "boot") setLoading(true);
    else if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      const rows = await fetchHojasFinalizadas({
        fechaDesde: filtersRef.current.fechaDesde,
        fechaHasta: filtersRef.current.fechaHasta,
      });
      setHojas(rows);
      setDetail((prev) => {
        if (!prev) return null;
        return rows.find((item) => item.id === prev.id) ?? prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("boot");
  }, [load]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load("silent");
    }, 280);
  }, [load]);

  const pendientesAll = useMemo(
    () => hojas.filter((item) => item.comprobantesCount === 0),
    [hojas],
  );
  const historialAll = useMemo(
    () => hojas.filter((item) => item.comprobantesCount > 0),
    [hojas],
  );

  const pendientes = useMemo(
    () => filterHojasClient(pendientesAll, filters.search),
    [pendientesAll, filters.search],
  );
  const historial = useMemo(
    () => filterHojasClient(historialAll, filters.search),
    [historialAll, filters.search],
  );

  const stats = useMemo(() => {
    const both = [...pendientes, ...historial];
    return {
      rutas: both.length,
      conComp: historial.length,
      pendientes: pendientes.length,
      total: both.reduce((acc, item) => acc + item.totalGeneral, 0),
    };
  }, [pendientes, historial]);

  const patchFilters = useCallback(
    (patch: Partial<PagosFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        filtersRef.current = next;
        return next;
      });
      if ("fechaDesde" in patch || "fechaHasta" in patch) {
        scheduleReload();
      }
    },
    [scheduleReload],
  );

  const clearFilters = useCallback(() => {
    const next = createDefaultPagosFilters();
    filtersRef.current = next;
    setFilters(next);
    scheduleReload();
  }, [scheduleReload]);

  const openDetail = useCallback(async (item: HojaPago) => {
    setDetail(item);
    setCompsLoading(true);
    try {
      const rows = await fetchComprobantes(item.id);
      setComprobantes(rows);
    } catch (err) {
      setComprobantes([]);
      notify("Error", err instanceof Error ? err.message : "No se pudieron cargar comprobantes");
    } finally {
      setCompsLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetail(null);
    setComprobantes([]);
    setUploadOpen(false);
  }, []);

  const openUpload = useCallback(() => setUploadOpen(true), []);
  const closeUpload = useCallback(() => setUploadOpen(false), []);

  const submitUpload = useCallback(
    async (input: ComprobanteUploadInput) => {
      if (!detail) return;
      setMutating(true);
      try {
        await uploadComprobante(detail.id, input);
        notify("Listo", "Comprobante adjuntado");
        closeUpload();
        const rows = await fetchComprobantes(detail.id);
        setComprobantes(rows);
        await load("silent");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo subir");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [detail, closeUpload, load],
  );

  const removeComprobante = useCallback(
    async (comp: ComprobantePago) => {
      if (!detail || !canMutate) return;
      const ok = await confirmDelete();
      if (!ok) return;
      setMutating(true);
      try {
        await deleteComprobante(detail.id, comp.id);
        setComprobantes((prev) => prev.filter((row) => row.id !== comp.id));
        setViewer((prev) => (prev?.id === comp.id ? null : prev));
        notify("Listo", "Comprobante eliminado");
        await load("silent");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
      } finally {
        setMutating(false);
      }
    },
    [detail, canMutate, load],
  );

  const openViewer = useCallback((item: ComprobantePago) => setViewer(item), []);
  const closeViewer = useCallback(() => setViewer(null), []);

  const openExternal = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      notify("Error", "No se pudo abrir el archivo");
    }
  }, []);

  return {
    canAccess,
    canMutate,
    tab,
    setTab,
    loading,
    refreshing,
    error,
    filters,
    patchFilters,
    clearFilters,
    hasFilters: hasActivePagosFilters(filters),
    pendientes,
    historial,
    pendientesTotal: pendientesAll.length,
    historialTotal: historialAll.length,
    stats,
    detail,
    openDetail,
    closeDetail,
    comprobantes,
    compsLoading,
    uploadOpen,
    openUpload,
    closeUpload,
    submitUpload,
    removeComprobante,
    viewer,
    openViewer,
    closeViewer,
    openExternal,
    mutating,
    reload: () => load("refresh"),
  };
}
