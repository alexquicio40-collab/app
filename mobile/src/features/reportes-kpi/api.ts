import { fetchPlantaRegistros } from "@/features/planta/api";
import { fetchConductores, fetchRoutes } from "@/features/routes/api";
import type { RouteItem } from "@/features/routes/types";
import { buildReportSnapshot, filterPlantaByPeriod } from "./lib/aggregate";
import { daysBetweenInclusive } from "./lib/period";
import type { ReportFilters, ReportSnapshot } from "./types";

const BATCH = 7;

/** Carga rutas del rango (1 request por día, en lotes). */
async function fetchRoutesForRange(
  fechaDesde: string,
  fechaHasta: string,
  conductorId: string | null,
): Promise<RouteItem[]> {
  const days = daysBetweenInclusive(fechaDesde, fechaHasta);
  const map = new Map<string, RouteItem>();

  for (let i = 0; i < days.length; i += BATCH) {
    const slice = days.slice(i, i + BATCH);
    const batches = await Promise.all(
      slice.map((fecha) =>
        fetchRoutes({
          fecha,
          conductorId: conductorId || undefined,
        }).catch(() => [] as RouteItem[]),
      ),
    );
    for (const rows of batches) {
      for (const item of rows) map.set(item.id, item);
    }
  }

  return [...map.values()];
}

export async function loadReportesKpi(filters: ReportFilters): Promise<{
  snapshot: ReportSnapshot;
  plantaHint: string | null;
}> {
  const [rutas, plantaAll] = await Promise.all([
    fetchRoutesForRange(filters.fechaDesde, filters.fechaHasta, filters.conductorId),
    fetchPlantaRegistros().catch(() => []),
  ]);

  const planta = filterPlantaByPeriod(plantaAll, filters.fechaDesde, filters.fechaHasta);
  const snapshot = buildReportSnapshot(rutas, planta, plantaAll.length);

  let plantaHint: string | null = null;
  if (planta.length === 0 && plantaAll.length > 0) {
    plantaHint = `Hay ${plantaAll.length} registros de planta, pero ninguno en el período. Prueba Mes o Personalizado.`;
  }

  return { snapshot, plantaHint };
}

export { fetchConductores };
