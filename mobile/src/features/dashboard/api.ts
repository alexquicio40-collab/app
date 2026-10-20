import { fetchLocales, peekLocalesCache } from "@/features/locales/api";
import { fetchLive } from "@/lib/fast-data";
import { limaDate } from "@/lib/api";
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

async function optional<T>(request: Promise<T>, fallback: T) {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

export async function dashboardSummaryRequest(): Promise<DashboardSummary> {
  const fecha = limaDate();
  const cachedLocales = peekLocalesCache();
  const [conductores, ubicaciones, locales, rutas, certificados, stats] = await Promise.all([
    optional(fetchLive<{ conductores?: unknown[] }>("/api/conductores"), { conductores: [] }),
    optional(fetchLive<{ ubicaciones?: unknown[] }>("/api/conductores/ubicaciones"), {
      ubicaciones: [],
    }),
    cachedLocales?.length
      ? Promise.resolve(cachedLocales)
      : fetchLocales({ includeFotos: false }).catch(() => []),
    optional(fetchLive<{ rutas?: { estado?: string }[] }>(`/api/rutas?fecha=${fecha}`), {
      rutas: [],
    }),
    optional(fetchLive<{ locales?: unknown[] }>("/api/certificados/pendientes"), { locales: [] }),
    optional(fetchLive<{ actividad?: { fecha: string; puntos: number }[] }>("/api/estadisticas"), {
      actividad: [],
    }),
  ]);

  const todayRoutes = rutas.rutas ?? [];
  const programadas = todayRoutes.filter(
    (item) => item.estado === "programado" || item.estado === "pendiente",
  ).length;
  const enCurso = todayRoutes.filter((item) =>
    ["en_ruta", "llego", "en_proceso"].includes(String(item.estado)),
  ).length;
  const recolectadas = todayRoutes.filter(
    (item) => item.estado === "recolectado" || item.estado === "completada",
  ).length;

  return {
    kpis: {
      operadores: conductores.conductores?.length ?? EMPTY.kpis.operadores,
      enLinea: ubicaciones.ubicaciones?.length ?? 0,
      locales: locales.length,
      rutasHoy: todayRoutes.length,
      rutasPendientes: todayRoutes.filter((item) =>
        ["programado", "pendiente", "en_ruta", "en_proceso", "llego"].includes(String(item.estado)),
      ).length,
      certificados: certificados.locales?.length ?? 0,
    },
    rutasHoy: { programadas, enCurso, recolectadas },
    actividad: (stats.actividad ?? []).map((item) => ({
      fecha: String(item.fecha),
      puntos: Number(item.puntos ?? 0),
    })),
  };
}
