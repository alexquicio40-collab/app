import { fetchConductores, loadReportesKpi } from "@/features/reportes-kpi/api";
import {
  applyPeriodo,
  createDefaultReportFilters,
  formatRangeLabel,
} from "@/features/reportes-kpi/lib/period";
import type { ReportFilters, ReportPeriodo, ReportSnapshot } from "@/features/reportes-kpi/types";
import type { ConductorOption } from "@/features/routes/types";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useState } from "react";

const EMPTY: ReportSnapshot = {
  envasesRutas: { litros: 0, baldes: 0, galoneras: 0 },
  envasesPlanta: { litros: 0, baldes: 0, galoneras: 0 },
  envasesTotal: { litros: 0, baldes: 0, galoneras: 0 },
  rutas: {
    total: 0,
    pendiente: 0,
    enProceso: 0,
    enRuta: 0,
    completada: 0,
    cancelada: 0,
    cumplimientoPct: 0,
  },
  porConductor: [],
  porLocal: [],
  plantaPorAsesor: [],
  plantaPorProveedor: [],
  plantaDetalle: [],
  plantaTotalSinFiltro: 0,
};

export function useReportesKpiScreen() {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const canAccess = rol === "administrador" || rol === "asesor";

  const [filters, setFilters] = useState<ReportFilters>(createDefaultReportFilters);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [snapshot, setSnapshot] = useState<ReportSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "boot" | "refresh" = "boot", nextFilters?: ReportFilters) => {
      if (!canAccess) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const active = nextFilters ?? filters;
      if (mode === "boot") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const [ops, report] = await Promise.all([
          fetchConductores().catch(() => [] as ConductorOption[]),
          loadReportesKpi(active),
        ]);
        setConductores(ops);
        setSnapshot(report.snapshot);
        setHint(report.plantaHint);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el reporte");
        setSnapshot(EMPTY);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canAccess, filters],
  );

  useEffect(() => {
    void load("boot");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  const setPeriodo = useCallback(
    (periodo: ReportPeriodo) => {
      const range = applyPeriodo(periodo, filters);
      const next = { ...filters, periodo, ...range };
      setFilters(next);
      void load("boot", next);
    },
    [filters, load],
  );

  const patchDates = useCallback(
    (patch: Partial<Pick<ReportFilters, "fechaDesde" | "fechaHasta">>) => {
      const next = {
        ...filters,
        periodo: "personalizado" as const,
        ...patch,
      };
      setFilters(next);
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(next.fechaDesde) &&
        /^\d{4}-\d{2}-\d{2}$/.test(next.fechaHasta)
      ) {
        void load("boot", next);
      }
    },
    [filters, load],
  );

  const setConductorId = useCallback(
    (conductorId: string | null) => {
      const next = { ...filters, conductorId };
      setFilters(next);
      void load("boot", next);
    },
    [filters, load],
  );

  return {
    canAccess,
    filters,
    rangeLabel: formatRangeLabel(filters.fechaDesde, filters.fechaHasta),
    conductores,
    snapshot,
    loading,
    refreshing,
    error,
    hint,
    setPeriodo,
    patchDates,
    setConductorId,
    reload: () => load("refresh"),
  };
}
