import type { ReportFilters, ReportPeriodo } from "../types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseIsoDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toIsoDay(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function applyPeriodo(periodo: ReportPeriodo, current?: Pick<ReportFilters, "fechaDesde" | "fechaHasta">) {
  const now = parseIsoDay(todayIso());
  if (periodo === "dia") {
    const day = toIsoDay(now);
    return { fechaDesde: day, fechaHasta: day };
  }
  if (periodo === "semana") {
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { fechaDesde: toIsoDay(monday), fechaHasta: toIsoDay(sunday) };
  }
  if (periodo === "mes") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { fechaDesde: toIsoDay(start), fechaHasta: toIsoDay(end) };
  }
  return {
    fechaDesde: current?.fechaDesde ?? todayIso(),
    fechaHasta: current?.fechaHasta ?? todayIso(),
  };
}

export function createDefaultReportFilters(): ReportFilters {
  const range = applyPeriodo("dia");
  return {
    periodo: "dia",
    fechaDesde: range.fechaDesde,
    fechaHasta: range.fechaHasta,
    conductorId: null,
    asignadorId: null,
  };
}

export function daysBetweenInclusive(desde: string, hasta: string) {
  const out: string[] = [];
  let cursor = parseIsoDay(desde);
  const end = parseIsoDay(hasta);
  if (cursor.getTime() > end.getTime()) return [desde];
  while (cursor.getTime() <= end.getTime()) {
    out.push(toIsoDay(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return out;
}

export function formatRangeLabel(desde: string, hasta: string) {
  if (desde === hasta) return desde;
  return `${desde} → ${hasta}`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatIngresoShort(iso: string | null) {
  if (!iso?.trim()) return "—";
  const raw = iso.trim().replace(" ", "T");
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!m) return iso.slice(0, 10);
  return `${m[3]} ${MESES[Number(m[2]) - 1]} · ${m[4] ?? "00"}:${m[5] ?? "00"}`;
}

export function dayKeyFromIso(iso: string | null) {
  if (!iso?.trim()) return null;
  const m = iso.trim().replace(" ", "T").match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}
