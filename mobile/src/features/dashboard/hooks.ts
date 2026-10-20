import { createStore } from "@/lib/fast-data";
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
  rutasHoy: { programadas: 0, enCurso: 0, recolectadas: 0 },
  actividad: [],
};

const dashStore = createStore<DashboardSummary>("dashboard-admin");

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary>(() => dashStore.peek() ?? EMPTY);
  const [loading, setLoading] = useState(() => !dashStore.peek());

  const reload = useCallback(async (force = false) => {
    if (!force && dashStore.fresh()) {
      const cached = dashStore.peek();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }
    const cached = dashStore.peek();
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const next = await dashboardSummaryRequest();
      dashStore.remember(next, true);
      setData(next);
    } catch {
      if (!dashStore.peek()) setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload: () => reload(true) };
}
