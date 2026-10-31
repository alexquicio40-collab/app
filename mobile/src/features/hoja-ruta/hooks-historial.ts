import {
  deleteHojaRuta,
  fetchHojaRutaById,
  fetchHojasRuta,
  peekHojasRuta,
} from "@/features/hoja-ruta/api";
import { formatFechaPdf, formatMoney } from "@/features/hoja-ruta/lib/format";
import { buildHojaRutaHtml, HOJA_PDF_PAGE } from "@/features/hoja-ruta/lib/pdf";
import type {
  HistorialFilters,
  HojaHistorialItem,
  HojaTotales,
} from "@/features/hoja-ruta/types";
import { fetchConductores } from "@/features/routes/api";
import type { ConductorOption } from "@/features/routes/types";
import { useAuth } from "@/providers/auth-provider";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

const EMPTY_FILTERS: HistorialFilters = {
  fechaDesde: null,
  fechaHasta: null,
  conductorId: null,
};

function totalesFromDetail(item: {
  data: { caja: number; filas: { galones: number; galonesPrecio: number; baldes: number; baldesPrecio: number; litros: number; litrosPrecio: number }[]; gastos: { monto: number }[] } | null;
  totalGalones: number;
  totalBaldes: number;
  totalLitros: number;
  totalGastos: number;
  totalGeneral: number;
  vuelto: number;
  caja: number;
}): HojaTotales {
  if (!item.data) {
    return {
      sumGalones: item.totalGalones,
      sumBaldes: item.totalBaldes,
      sumLitros: item.totalLitros,
      sumGastos: item.totalGastos,
      totalVentas: item.totalGalones + item.totalBaldes + item.totalLitros,
      totalGeneral: item.totalGeneral,
      vuelto: item.vuelto,
    };
  }
  let sumGalones = 0;
  let sumBaldes = 0;
  let sumLitros = 0;
  for (const fila of item.data.filas) {
    sumGalones += fila.galones * fila.galonesPrecio;
    sumBaldes += fila.baldes * fila.baldesPrecio;
    sumLitros += fila.litros * fila.litrosPrecio;
  }
  const sumGastos = item.data.gastos.reduce((acc, g) => acc + g.monto, 0);
  const totalVentas = sumGalones + sumBaldes + sumLitros;
  const totalGeneral = totalVentas + sumGastos;
  return {
    sumGalones,
    sumBaldes,
    sumLitros,
    sumGastos,
    totalVentas,
    totalGeneral,
    vuelto: item.data.caja - totalGeneral,
  };
}

export function useHistorialHr(enabled: boolean) {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const puedeVerTodas = rol === "administrador";

  const [filters, setFilters] = useState<HistorialFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<HojaHistorialItem[]>([]);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const loadedOnce = useRef(false);

  const load = useCallback(
    async (mode: "boot" | "refresh" = "boot", nextFilters?: HistorialFilters) => {
      const active = nextFilters ?? filtersRef.current;
      if (mode === "boot") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const query: HistorialFilters = {
          fechaDesde: active.fechaDesde,
          fechaHasta: active.fechaHasta,
          conductorId: puedeVerTodas
            ? active.conductorId
            : user?.id != null
              ? String(user.id)
              : "0",
        };
        const cached = peekHojasRuta(query);
        if (cached) {
          setItems(cached);
          setLoading(false);
        }
        const [rows, ops] = await Promise.all([
          fetchHojasRuta(query, { force: mode === "refresh" }),
          puedeVerTodas
            ? fetchConductores().catch(() => [] as ConductorOption[])
            : Promise.resolve([] as ConductorOption[]),
        ]);
        setItems(rows);
        if (puedeVerTodas) setConductores(ops);
        loadedOnce.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [puedeVerTodas, user?.id],
  );

  useEffect(() => {
    if (!enabled) return;
    if (loadedOnce.current) {
      void load("refresh");
      return;
    }
    void load("boot");
  }, [enabled, load]);

  const patchFilters = useCallback(
    (patch: Partial<HistorialFilters>) => {
      const next = { ...filtersRef.current, ...patch };
      if (!puedeVerTodas) next.conductorId = null;

      const desdeOk = !next.fechaDesde || /^\d{4}-\d{2}-\d{2}$/.test(next.fechaDesde);
      const hastaOk = !next.fechaHasta || /^\d{4}-\d{2}-\d{2}$/.test(next.fechaHasta);
      setFilters(next);
      if (desdeOk && hastaOk) void load("boot", next);
    },
    [load, puedeVerTodas],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    void load("boot", EMPTY_FILTERS);
  }, [load]);

  const regenerarPdf = useCallback(async (item: HojaHistorialItem) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const detail = await fetchHojaRutaById(item.id);
      if (!detail.data) throw new Error("No se pudo obtener el detalle");
      const payload = {
        ...detail.data,
        fecha: detail.fecha ?? detail.data.fecha,
      };
      const totales = totalesFromDetail({ ...detail, data: payload });
      const html = await buildHojaRutaHtml(payload, totales);
      const file = await Print.printToFileAsync({ html, ...HOJA_PDF_PAGE });
      const fechaLabel = formatFechaPdf(payload.fecha);

      if (Platform.OS === "web") {
        await Print.printAsync({ html, ...HOJA_PDF_PAGE });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Hoja de ruta ${fechaLabel}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        await Print.printAsync({ html, ...HOJA_PDF_PAGE });
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "No se pudo regenerar el PDF",
      );
    } finally {
      setBusyId(null);
    }
  }, [busyId]);

  const remove = useCallback(
    (item: HojaHistorialItem) => {
      Alert.alert(
        "¿Eliminar hoja?",
        "Se eliminará del historial. Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              void (async () => {
                setBusyId(item.id);
                try {
                  await deleteHojaRuta(item.id);
                  setItems((prev) => prev.filter((row) => row.id !== item.id));
                } catch (err) {
                  Alert.alert(
                    "Error",
                    err instanceof Error ? err.message : "Error eliminando",
                  );
                } finally {
                  setBusyId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [],
  );

  const hasFilters = Boolean(
    filters.fechaDesde || filters.fechaHasta || (puedeVerTodas && filters.conductorId),
  );

  return {
    puedeVerTodas,
    filters,
    items,
    conductores,
    loading,
    refreshing,
    error,
    busyId,
    hasFilters,
    patchFilters,
    clearFilters,
    regenerarPdf,
    remove,
    reload: () => load("refresh"),
    formatMoney,
  };
}
