import {
  createHojaRuta,
  fetchCajaDelDia,
  fetchLocalesActivos,
  fetchUserPlaca,
} from "@/features/hoja-ruta/api";
import { computeTotales, parseNum, toFilaData, toGastoData } from "@/features/hoja-ruta/lib/calc";
import { newKey, todayIso } from "@/features/hoja-ruta/lib/format";
import { buildHojaRutaHtml } from "@/features/hoja-ruta/lib/pdf";
import type { GastoForm, LocalOption, LocalVisitaForm } from "@/features/hoja-ruta/types";
import { useAuth } from "@/providers/auth-provider";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, InteractionManager, Platform } from "react-native";

function emptyFila(local: LocalOption): LocalVisitaForm {
  return {
    key: newKey("local"),
    local,
    galones: "",
    galonesPrecio: "",
    baldes: "",
    baldesPrecio: "",
    litros: "",
    litrosPrecio: "",
  };
}

function emptyGasto(): GastoForm {
  return { key: newKey("gasto"), descripcion: "", monto: "" };
}

export function useHojaRutaScreen() {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const canAccess = rol === "operador" || rol === "administrador" || rol === "conductor";

  const [fecha, setFecha] = useState(todayIso);
  const [placa, setPlaca] = useState("");
  const [acompanante, setAcompanante] = useState("");
  const [caja, setCaja] = useState("");
  const [filas, setFilas] = useState<LocalVisitaForm[]>([]);
  const [gastos, setGastos] = useState<GastoForm[]>([]);
  const [locales, setLocales] = useState<LocalOption[]>([]);
  /** Solo bloquea el shell inicial (placa/caja). Los locales van aparte. */
  const [loading, setLoading] = useState(true);
  const [localesLoading, setLocalesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const localesTask = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(
    null,
  );

  const totales = useMemo(() => computeTotales(filas, gastos, caja), [filas, gastos, caja]);
  const selectedIds = useMemo(() => new Set(filas.map((f) => f.local.id)), [filas]);

  const precargarCaja = useCallback(async (day: string, forceEmpty = false) => {
    const monto = await fetchCajaDelDia(day).catch(() => 0);
    setCaja((prev) => {
      if (!forceEmpty && prev.trim()) return prev;
      return monto > 0 ? String(monto) : "";
    });
  }, []);

  const loadLocales = useCallback(async (force = false) => {
    setLocalesLoading(true);
    try {
      const ops = await fetchLocalesActivos({ force });
      setLocales(ops);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los locales");
    } finally {
      setLocalesLoading(false);
    }
  }, []);

  const load = useCallback(
    async (mode: "boot" | "refresh" = "boot") => {
      if (!user) return;
      if (mode === "boot") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        // Ruta crítica: desbloquea el formulario en cuanto llegan placa + caja.
        const [userPlaca] = await Promise.all([
          fetchUserPlaca(user.id),
          precargarCaja(fecha),
        ]);
        setPlaca(userPlaca);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la hoja");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }

      // Locales (payload grande): después del primer paint / en refresh forzado.
      if (mode === "refresh") {
        await loadLocales(true);
        return;
      }
      localesTask.current?.cancel();
      localesTask.current = InteractionManager.runAfterInteractions(() => {
        void loadLocales(false);
      });
    },
    [user, fecha, precargarCaja, loadLocales],
  );

  useEffect(() => {
    void load("boot");
    return () => {
      localesTask.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
    if (!locales.length && !localesLoading) {
      void loadLocales(false);
    }
  }, [locales.length, localesLoading, loadLocales]);

  const changeFecha = useCallback(
    async (next: string) => {
      setFecha(next);
      setCaja("");
      await precargarCaja(next, true);
    },
    [precargarCaja],
  );

  const addLocal = useCallback((local: LocalOption) => {
    const fila = emptyFila(local);
    setFilas((prev) => {
      if (prev.some((f) => f.local.id === local.id)) return prev;
      return [...prev, fila];
    });
    setExpandedKey(fila.key);
    setPickerOpen(false);
  }, []);

  const patchFila = useCallback((key: string, patch: Partial<LocalVisitaForm>) => {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }, []);

  const removeFila = useCallback((key: string) => {
    setFilas((prev) => {
      const next = prev.filter((f) => f.key !== key);
      setExpandedKey((current) => {
        if (current !== key) return current;
        return next.length ? next[next.length - 1].key : null;
      });
      return next;
    });
  }, []);

  const toggleFila = useCallback((key: string) => {
    setExpandedKey((current) => (current === key ? null : key));
  }, []);

  const addGasto = useCallback(() => {
    setGastos((prev) => [...prev, emptyGasto()]);
  }, []);

  const patchGasto = useCallback((key: string, patch: Partial<GastoForm>) => {
    setGastos((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }, []);

  const removeGasto = useCallback((key: string) => {
    setGastos((prev) => prev.filter((g) => g.key !== key));
  }, []);

  const resetForm = useCallback(async () => {
    const day = todayIso();
    setFecha(day);
    setAcompanante("");
    setCaja("");
    setFilas([]);
    setGastos([]);
    setExpandedKey(null);
    await precargarCaja(day, true);
  }, [precargarCaja]);

  const clearAll = useCallback(() => {
    Alert.alert("Limpiar hoja", "¿Borrar locales, gastos y caja?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpiar",
        style: "destructive",
        onPress: () => void resetForm(),
      },
    ]);
  }, [resetForm]);

  const exportar = useCallback(async () => {
    if (!user || exporting) return;
    setExporting(true);
    setError(null);
    try {
      const cajaNum = parseNum(caja);
      const payloadData = {
        chofer: user.name,
        operadorAcompanante: acompanante.trim(),
        placa,
        fecha,
        caja: cajaNum,
        filas: filas.map(toFilaData),
        gastos: gastos.map(toGastoData),
      };

      try {
        await createHojaRuta({
          operadorAcompanante: acompanante.trim(),
          placa,
          fecha,
          caja: cajaNum,
          totalGalones: totales.sumGalones,
          totalBaldes: totales.sumBaldes,
          totalLitros: totales.sumLitros,
          totalGastos: totales.sumGastos,
          totalGeneral: totales.totalGeneral,
          vuelto: totales.vuelto,
          data: payloadData,
        });
      } catch {
        // Flutter continúa con PDF aunque falle el POST
      }

      const html = buildHojaRutaHtml(payloadData, totales);
      const file = await Print.printToFileAsync({ html });

      if (Platform.OS === "web") {
        await Print.printAsync({ html });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Hoja de ruta ${fecha}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        await Print.printAsync({ html });
      }

      await resetForm();
      Alert.alert("Listo", "Hoja de ruta exportada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo exportar");
    } finally {
      setExporting(false);
    }
  }, [
    user,
    exporting,
    caja,
    acompanante,
    placa,
    fecha,
    filas,
    gastos,
    totales,
    resetForm,
  ]);

  return {
    canAccess,
    chofer: user?.name ?? "",
    fecha,
    placa,
    acompanante,
    caja,
    filas,
    gastos,
    locales,
    selectedIds,
    totales,
    loading,
    localesLoading,
    refreshing,
    exporting,
    error,
    pickerOpen,
    expandedKey,
    setPickerOpen,
    openPicker,
    setAcompanante,
    setCaja,
    changeFecha,
    addLocal,
    patchFila,
    removeFila,
    toggleFila,
    addGasto,
    patchGasto,
    removeGasto,
    clearAll,
    exportar,
    reload: () => load("refresh"),
  };
}
