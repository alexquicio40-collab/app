import { useCallback, useEffect, useState } from "react";
import { dashboardSummaryRequest } from "./api";
import type { DashboardSummary } from "./types";

const EMPTY: DashboardSummary = {
  kpis: {
    operadores: 0,
    enLinea: 0,
    locales: 0,
    rutasHoy: 0,
    rutasPendientes: 0,
    certificados: 0,
  },
  rutasHoy: { pendientes: 0, enProceso: 0, completadas: 0 },
  actividad: [],
};

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await dashboardSummaryRequest());
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
}
