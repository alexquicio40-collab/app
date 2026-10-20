import type { User } from "@/features/auth/types";
import { fetchLocales, peekLocalesCache } from "@/features/locales/api";
import { createStore } from "@/lib/fast-data";
import { fetchPlantaRegistros } from "@/features/planta/api";
import { fetchConductores, fetchRoutes } from "@/features/routes/api";
import type { RouteItem } from "@/features/routes/types";
import { clavesDeLocales, esDeSusLocales, localesDelUsuario, seesAllUsers } from "@/lib/scope-user";
import {
  asignadorKey,
  buildReportSnapshot,
  filterPlantaByPeriod,
  uniqueAsignadores,
} from "./lib/aggregate";
import { daysBetweenInclusive } from "./lib/period";
import type { AsignadorOption, ReportFilters, ReportSnapshot } from "./types";

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

type ReportPack = {
  snapshot: ReportSnapshot;
  plantaHint: string | null;
  asignadores: AsignadorOption[];
};

function reportStore(filters: ReportFilters, user?: User | null) {
  return createStore<ReportPack>(
    `kpi:${filters.fechaDesde}:${filters.fechaHasta}:${filters.conductorId ?? ""}:${filters.asignadorId ?? ""}:${user?.id ?? ""}`,
  );
}

export function peekReportesKpi(filters: ReportFilters, user?: User | null) {
  return reportStore(filters, user).peek();
}

export async function loadReportesKpi(
  filters: ReportFilters,
  user?: User | null,
  opts?: { force?: boolean },
): Promise<ReportPack> {
  const store = reportStore(filters, user);
  if (!opts?.force && store.fresh()) {
    const cached = store.peek();
    if (cached) return cached;
  }

  const cachedLocales = peekLocalesCache();
  const [rutasRaw, plantaRaw, localesRaw] = await Promise.all([
    fetchRoutesForRange(filters.fechaDesde, filters.fechaHasta, filters.conductorId),
    fetchPlantaRegistros().catch(() => []),
    seesAllUsers(user?.rol)
      ? Promise.resolve([])
      : cachedLocales?.length
        ? Promise.resolve(cachedLocales)
        : fetchLocales({ includeFotos: false }).catch(() => []),
  ]);

  const all = seesAllUsers(user?.rol);
  const mine = all ? [] : localesDelUsuario(localesRaw, user);
  if (!all && mine.length === 0) {
    const empty: ReportPack = {
      snapshot: buildReportSnapshot([], [], 0),
      plantaHint: "El reporte solo incluye los locales que registraste. Aún no tienes locales.",
      asignadores: [],
    };
    store.remember(empty);
    return empty;
  }
  const claves = clavesDeLocales(mine);
  const rutasAll = all ? rutasRaw : rutasRaw.filter((item) => esDeSusLocales(item, claves));
  const plantaAll = all
    ? plantaRaw
    : plantaRaw.filter((item) => esDeSusLocales(item, claves));

  const asignadores = uniqueAsignadores(rutasAll);
  const rutas = filters.asignadorId
    ? rutasAll.filter((item) => asignadorKey(item) === filters.asignadorId)
    : rutasAll;

  const planta = filterPlantaByPeriod(plantaAll, filters.fechaDesde, filters.fechaHasta);
  const snapshot = buildReportSnapshot(rutas, planta, plantaAll.length);

  let plantaHint: string | null = null;
  if (planta.length === 0 && plantaAll.length > 0) {
    plantaHint = `Hay ${plantaAll.length} registros de planta, pero ninguno en el período. Prueba Mes o Personalizado.`;
  }

  const pack = { snapshot, plantaHint, asignadores };
  store.remember(pack);
  return pack;
}

export { fetchConductores };
