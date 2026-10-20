import { fetchHistorial } from "@/features/certificados/api";
import { fetchRoutes, fetchRoutesSpan, peekRoutes } from "@/features/routes/api";
import type { RouteItem } from "@/features/routes/types";
import { fetchLive } from "@/lib/fast-data";
import { hoy } from "@/lib/fecha-lima";
import type { FuenteGerencia } from "./lib/build";

function mesDe(fecha: string) {
  const [year, month] = fecha.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    desde: `${fecha.slice(0, 8)}01`,
    hasta: `${fecha.slice(0, 8)}${String(last).padStart(2, "0")}`,
  };
}

function mesAnterior(fecha: string) {
  const [year, month] = fecha.split("-").map(Number);
  const previo = new Date(Date.UTC(year, month - 2, 1));
  const y = previo.getUTCFullYear();
  const m = String(previo.getUTCMonth() + 1).padStart(2, "0");
  const last = new Date(Date.UTC(y, previo.getUTCMonth() + 1, 0)).getUTCDate();
  return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${String(last).padStart(2, "0")}` };
}

function readMeta(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const bag = payload as Record<string, unknown>;
  const nested = bag.meta ?? bag.kpis ?? bag;
  if (!nested || typeof nested !== "object") return null;
  const raw = (nested as Record<string, unknown>).meta_mensual ?? (nested as Record<string, unknown>).metaMensual;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function unir(grupos: RouteItem[][]) {
  const map = new Map<string, RouteItem>();
  for (const grupo of grupos) {
    for (const item of grupo) map.set(item.id, item);
  }
  return [...map.values()];
}

export async function fetchGerenciaDia(opts?: {
  onPartial?: (fuente: FuenteGerencia) => void;
}): Promise<FuenteGerencia> {
  const fecha = hoy();
  const mes = mesDe(fecha);
  const previo = mesAnterior(fecha);

  opts?.onPartial?.({
    hoy: fecha,
    rutas: peekRoutes({ fecha }) ?? [],
    certificados: null,
    metaMensual: null,
    coberturaDesde: fecha,
    coberturaHasta: fecha,
  });

  const [rutasHoy, stats] = await Promise.all([
    fetchRoutes({ fecha }).catch(() => [] as RouteItem[]),
    fetchLive<unknown>("/api/estadisticas").catch(() => null),
  ]);
  const first: FuenteGerencia = {
    hoy: fecha,
    rutas: rutasHoy,
    certificados: null,
    metaMensual: readMeta(stats),
    coberturaDesde: fecha,
    coberturaHasta: fecha,
  };
  opts?.onPartial?.(first);

  const [rutasMes, historial] = await Promise.all([
    fetchRoutesSpan(mes.desde, mes.hasta).catch(() => [] as RouteItem[]),
    fetchHistorial({ fechaDesde: mes.desde, fechaHasta: mes.hasta }).catch(() => null),
  ]);
  const mid: FuenteGerencia = {
    ...first,
    rutas: unir([rutasHoy, rutasMes]),
    certificados: historial
      ? historial.map((item) => item.createdAt || item.rutaFecha || "").filter(Boolean)
      : null,
    coberturaDesde: mes.desde,
    coberturaHasta: mes.hasta,
  };
  opts?.onPartial?.(mid);

  const rutasPrevias = await fetchRoutesSpan(previo.desde, previo.hasta).catch(() => [] as RouteItem[]);
  return {
    ...mid,
    rutas: unir([mid.rutas, rutasPrevias]),
    coberturaDesde: previo.desde,
    coberturaHasta: mes.hasta,
  };
}

export async function fetchRutasFuera(desde: string, hasta: string) {
  if (desde > hasta) return [] as RouteItem[];
  return fetchRoutesSpan(desde, hasta);
}

export function ampliarFuente(
  fuente: FuenteGerencia,
  extra: RouteItem[],
  desde: string,
  hasta: string,
): FuenteGerencia {
  return {
    ...fuente,
    rutas: unir([fuente.rutas, extra]),
    coberturaDesde: desde < fuente.coberturaDesde ? desde : fuente.coberturaDesde,
    coberturaHasta: hasta > fuente.coberturaHasta ? hasta : fuente.coberturaHasta,
  };
}
