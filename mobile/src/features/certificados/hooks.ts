import { matchAsesorTag, seesAllUsers } from "@/lib/scope-user";
import { isAdministrador, isAsesor } from "@/lib/role-nav";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import {
  corregirCodigoCertificado,
  deleteHistorialItem,
  fetchAsesoresFromPendientes,
  fetchHistorial,
  fetchBorradorCertificado,
  fetchCertificadosAjuste,
  fetchPendientes,
  saveCertificadosAjuste,
  peekHistorial,
  peekPendientes,
  generarCertificado,
  generarCertificadoManual,
  type CertificadoTexto,
} from "./api";
import {
  countHistorialEsteMes,
  createDefaultHistorialFilters,
  createDefaultPendientesFilters,
  hasActiveHistorialFilters,
  hasActivePendientesFilters,
} from "./lib/format";
import type {
  CertificadoHistorial,
  CertificadoPendiente,
  CertificadoTab,
  CertUploadInput,
  HistorialFilters,
  PendientesFilters,
} from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function confirmDelete(nombre: string) {
  if (Platform.OS === "web") {
    return window.confirm(`¿Eliminar el certificado de "${nombre}" del historial?`);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert("Eliminar historial", `¿Eliminar el certificado de "${nombre}"?`, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

function filterHistorialClient(
  rows: CertificadoHistorial[],
  search: string,
): CertificadoHistorial[] {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((item) => {
    return (
      item.localNombre.toLowerCase().includes(q) ||
      item.localRuc.toLowerCase().includes(q) ||
      item.localRazonSocial.toLowerCase().includes(q) ||
      item.conductorNombre.toLowerCase().includes(q) ||
      item.usuarioNombre.toLowerCase().includes(q) ||
      item.observaciones.toLowerCase().includes(q)
    );
  });
}

export function useCertificadosScreen() {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const canAccess = rol === "administrador" || rol === "asesor";
  const canDeleteHistorial = rol === "administrador";
  const canToggleAuto = isAdministrador(rol);
  const canUpload = canAccess;
  const allUsers = seesAllUsers(rol) || isAsesor(rol);

  const [tab, setTab] = useState<CertificadoTab>("pendientes");
  const [pendientes, setPendientes] = useState<CertificadoPendiente[]>(
    () => peekPendientes(createDefaultPendientesFilters()) ?? [],
  );
  const [historial, setHistorial] = useState<CertificadoHistorial[]>(() => {
    const defaults = createDefaultHistorialFilters();
    return peekHistorial({ fechaDesde: defaults.fechaDesde, fechaHasta: defaults.fechaHasta }) ?? [];
  });
  const [asesores, setAsesores] = useState<string[]>([]);
  const [pendFilters, setPendFilters] = useState<PendientesFilters>(createDefaultPendientesFilters);
  const [histFilters, setHistFilters] = useState<HistorialFilters>(createDefaultHistorialFilters);
  const [loading, setLoading] = useState(() => {
    const defaultsPend = createDefaultPendientesFilters();
    const defaultsHist = createDefaultHistorialFilters();
    return !peekPendientes(defaultsPend) && !peekHistorial({
      fechaDesde: defaultsHist.fechaDesde,
      fechaHasta: defaultsHist.fechaHasta,
    });
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<CertificadoPendiente | null>(null);
  const [codigoModo, setCodigoModo] = useState<"manual" | "editar" | null>(null);
  const [codigoTarget, setCodigoTarget] = useState<CertificadoHistorial | null>(null);
  const [borrador, setBorrador] = useState<CertificadoTexto | null>(null);
  const [borradorRuta, setBorradorRuta] = useState<{ localId: string; rutaId: string } | null>(null);
  const [detailTarget, setDetailTarget] = useState<CertificadoPendiente | null>(null);
  const [historialDetail, setHistorialDetail] = useState<CertificadoHistorial | null>(null);
  const [viewer, setViewer] = useState<CertificadoHistorial | null>(null);
  const [certificadosAuto, setCertificadosAuto] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendFiltersRef = useRef(pendFilters);
  pendFiltersRef.current = pendFilters;
  const histFiltersRef = useRef(histFilters);
  histFiltersRef.current = histFilters;

  const load = useCallback(async (mode: "boot" | "refresh" | "silent" = "boot") => {
    if (mode === "boot") {
      const cachedPend = peekPendientes(pendFiltersRef.current);
      const cachedHist = peekHistorial({
        fechaDesde: histFiltersRef.current.fechaDesde,
        fechaHasta: histFiltersRef.current.fechaHasta,
      });
      if (cachedPend || cachedHist) setLoading(false);
      else setLoading(true);
    } else if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      const scopePend = (rows: typeof pendientes) =>
        allUsers ? rows : rows.filter((item) => matchAsesorTag(item.asesorBioClim, user));
      const scopeHist = (rows: typeof historial) =>
        allUsers
          ? rows
          : rows.filter(
              (item) =>
                (item.usuarioId && user?.id != null && String(item.usuarioId) === String(user.id)) ||
                matchAsesorTag(item.usuarioNombre, user),
            );
      const [pendRows, histRows, autoOn] = await Promise.all([
        fetchPendientes(pendFiltersRef.current, {
          force: mode === "refresh",
          onPartial: (partial) => {
            setPendientes(scopePend(partial));
            setLoading(false);
          },
        }),
        fetchHistorial(
          {
            fechaDesde: histFiltersRef.current.fechaDesde,
            fechaHasta: histFiltersRef.current.fechaHasta,
          },
          {
            force: mode === "refresh",
            onPartial: (partial) => {
              setHistorial(scopeHist(partial));
              setLoading(false);
            },
          },
        ),
        fetchCertificadosAjuste().catch(() => false),
      ]);
      const pendScoped = scopePend(pendRows);
      const histScoped = scopeHist(histRows);
      setPendientes(pendScoped);
      setHistorial(histScoped);
      setCertificadosAuto(Boolean(autoOn));
      setAsesores(allUsers ? await fetchAsesoresFromPendientes(pendScoped) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los certificados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [allUsers, user]);

  useEffect(() => {
    void load("boot");
  }, [load]);

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load("silent");
    }, 350);
  }, [load]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const filteredHistorial = useMemo(
    () => filterHistorialClient(historial, histFilters.search),
    [historial, histFilters.search],
  );

  const stats = useMemo(
    () => ({
      pendientes: pendientes.length,
      emitidos: historial.length,
      esteMes: countHistorialEsteMes(historial.map((item) => item.createdAt)),
    }),
    [pendientes.length, historial],
  );

  const patchPendFilters = useCallback(
    (patch: Partial<PendientesFilters>) => {
      setPendFilters((prev) => {
        const next = { ...prev, ...patch };
        pendFiltersRef.current = next;
        return next;
      });
      scheduleReload();
    },
    [scheduleReload],
  );

  const clearPendFilters = useCallback(() => {
    const next = createDefaultPendientesFilters();
    pendFiltersRef.current = next;
    setPendFilters(next);
    scheduleReload();
  }, [scheduleReload]);

  const patchHistFilters = useCallback(
    (patch: Partial<HistorialFilters>) => {
      setHistFilters((prev) => {
        const next = { ...prev, ...patch };
        histFiltersRef.current = next;
        return next;
      });
      if ("fechaDesde" in patch || "fechaHasta" in patch) {
        scheduleReload();
      }
    },
    [scheduleReload],
  );

  const clearHistFilters = useCallback(() => {
    const next = createDefaultHistorialFilters();
    histFiltersRef.current = next;
    setHistFilters(next);
    scheduleReload();
  }, [scheduleReload]);

  const openUpload = useCallback((item: CertificadoPendiente) => {
    setDetailTarget(null);
    setUploadTarget(item);
  }, []);

  const closeUpload = useCallback(() => setUploadTarget(null), []);

  const openDetail = useCallback((item: CertificadoPendiente) => {
    setDetailTarget(item);
  }, []);

  const closeDetail = useCallback(() => setDetailTarget(null), []);

  const openViewer = useCallback((item: CertificadoHistorial) => setViewer(item), []);
  const closeViewer = useCallback(() => setViewer(null), []);

  const openHistorialDetail = useCallback((item: CertificadoHistorial) => {
    setHistorialDetail(item);
  }, []);
  const closeHistorialDetail = useCallback(() => setHistorialDetail(null), []);

  const guardarCodigo = useCallback(
    async (value: { codigo: string; localId: string }) => {
      if (!/^CBC-\d{1,6}-\d{4}$/i.test(value.codigo)) {
        notify("Código", "Usa el formato CBC-0664-2026");
        return;
      }
      if (codigoModo !== "editar" && !value.localId) {
        notify("Local", "Indica el ID del local");
        return;
      }
      setMutating(true);
      try {
        if (codigoModo === "editar" && codigoTarget) {
          const result = await corregirCodigoCertificado(codigoTarget.id, value.codigo);
          notify("Código actualizado", result.codigo || value.codigo);
        } else {
          const result = await generarCertificadoManual(value.localId, value.codigo);
          notify("Certificado manual", result.codigo || value.codigo);
        }
        setCodigoModo(null);
        setCodigoTarget(null);
        await load("refresh");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo guardar el código");
      } finally {
        setMutating(false);
      }
    },
    [codigoModo, codigoTarget, load],
  );

  const generar = useCallback(
    async (item: CertificadoPendiente) => {
      if (!item.ultimaRutaId) {
        notify("Sin ruta", "Primero tiene que haber un recojo recolectado en este local");
        return;
      }
      setMutating(true);
      try {
        const draft = await fetchBorradorCertificado(item.id, item.ultimaRutaId);
        if (!draft) throw new Error("No se pudo preparar el certificado");
        setBorradorRuta({ localId: item.id, rutaId: item.ultimaRutaId });
        setBorrador(draft);
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo preparar");
      } finally {
        setMutating(false);
      }
    },
    [],
  );

  const procesarBorrador = useCallback(
    async (texto: CertificadoTexto) => {
      if (!borradorRuta) return;
      setMutating(true);
      try {
        const fechaProsa = texto.fechaProsa
          .replace(/^El presente certificado es por todo el retiro del día\s*/i, "")
          .replace(/\.$/, "")
          .trim();
        const result = await generarCertificado(borradorRuta.localId, borradorRuta.rutaId, {
          ...texto,
          fechaProsa,
        });
        setBorrador(null);
        setBorradorRuta(null);
        notify("Certificado listo", result.codigo ? `Código ${result.codigo}` : "Asignado al local");
        await load("refresh");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo generar");
      } finally {
        setMutating(false);
      }
    },
    [borradorRuta, load],
  );

  const submitUpload = useCallback(
    async (_input: CertUploadInput) => {
      if (!uploadTarget) return;
      await generar(uploadTarget);
      closeUpload();
    },
    [uploadTarget, closeUpload, generar],
  );

  const removeHistorial = useCallback(
    async (item: CertificadoHistorial) => {
      if (!canDeleteHistorial) return;
      const ok = await confirmDelete(item.localNombre);
      if (!ok) return;
      setMutating(true);
      try {
        await deleteHistorialItem(item.id);
        setHistorial((prev) => prev.filter((row) => row.id !== item.id));
        setViewer((prev) => (prev?.id === item.id ? null : prev));
        setHistorialDetail((prev) => (prev?.id === item.id ? null : prev));
        notify("Listo", "Registro eliminado del historial");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
      } finally {
        setMutating(false);
      }
    },
    [canDeleteHistorial],
  );

  const openExternal = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      notify("Error", "No se pudo abrir el archivo");
    }
  }, []);

  const toggleCertificadosAuto = useCallback(async () => {
    if (!canToggleAuto) return;
    setMutating(true);
    try {
      const next = await saveCertificadosAjuste(!certificadosAuto);
      setCertificadosAuto(next);
      notify(
        "Certificados",
        next
          ? "Emisión automática encendida"
          : "Emisión automática apagada. Usa Manual para generar.",
      );
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo cambiar el ajuste");
    } finally {
      setMutating(false);
    }
  }, [canToggleAuto, certificadosAuto]);

  return {
    canAccess,
    canUpload,
    canDeleteHistorial,
    canToggleAuto,
    certificadosAuto,
    toggleCertificadosAuto,
    tab,
    setTab,
    loading,
    refreshing,
    error,
    pendientes,
    historial: filteredHistorial,
    historialTotal: historial.length,
    asesores,
    pendFilters,
    histFilters,
    patchPendFilters,
    clearPendFilters,
    patchHistFilters,
    clearHistFilters,
    hasPendFilters: hasActivePendientesFilters(pendFilters),
    hasHistFilters: hasActiveHistorialFilters(histFilters),
    stats,
    mutating,
    detailTarget,
    openDetail,
    closeDetail,
    historialDetail,
    openHistorialDetail,
    closeHistorialDetail,
    uploadTarget,
    openUpload,
    closeUpload,
    submitUpload,
    generar,
    borrador,
    cerrarBorrador: () => {
      setBorrador(null);
      setBorradorRuta(null);
    },
    procesarBorrador,
    codigoModo,
    codigoInicial: codigoTarget?.codigoRegistro ?? "",
    abrirManual: () => {
      setCodigoTarget(null);
      setCodigoModo("manual");
    },
    abrirEditarCodigo: (item: CertificadoHistorial) => {
      setCodigoTarget(item);
      setCodigoModo("editar");
    },
    cerrarCodigo: () => {
      setCodigoModo(null);
      setCodigoTarget(null);
    },
    guardarCodigo,
    viewer,
    openViewer,
    closeViewer,
    removeHistorial,
    openExternal,
    reload: () => load("refresh"),
  };
}
