import { api, limaDate } from "@/lib/api";
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

async function optional<T>(request: Promise<T>, fallback: T) {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

export async function dashboardSummaryRequest(): Promise<DashboardSummary> {
  const fecha = limaDate();
  const [conductores, ubicaciones, locales, rutas, certificados, stats] = await Promise.all([
    optional(api<{ conductores?: unknown[] }>("/api/conductores"), { conductores: [] }),
    optional(api<{ ubicaciones?: unknown[] }>("/api/conductores/ubicaciones"), { ubicaciones: [] }),
    optional(api<{ locales?: unknown[] }>("/api/locales"), { locales: [] }),
    optional(api<{ rutas?: { estado?: string }[] }>(`/api/rutas?fecha=${fecha}`), { rutas: [] }),
    optional(api<{ locales?: unknown[] }>("/api/certificados/pendientes"), { locales: [] }),
    optional(api<{ actividad?: { fecha: string; puntos: number }[] }>("/api/estadisticas"), { actividad: [] }),
  ]);

  const todayRoutes = rutas.rutas ?? [];
  const pendientes = todayRoutes.filter((item) => item.estado === "pendiente").length;
  const enProceso = todayRoutes.filter((item) => item.estado === "en_proceso" || item.estado === "en_ruta").length;
  const completadas = todayRoutes.filter((item) => item.estado === "completada").length;

  return {
    kpis: {
      operadores: conductores.conductores?.length ?? EMPTY.kpis.operadores,
      enLinea: ubicaciones.ubicaciones?.length ?? 0,
      locales: locales.locales?.length ?? 0,
      rutasHoy: todayRoutes.length,
      rutasPendientes: todayRoutes.filter((item) => item.estado === "pendiente" || item.estado === "en_proceso").length,
      certificados: certificados.locales?.length ?? 0,
    },
    rutasHoy: { pendientes, enProceso, completadas },
    actividad: (stats.actividad ?? []).map((item) => ({
      fecha: String(item.fecha),
      puntos: Number(item.puntos ?? 0),
    })),
  };
}
