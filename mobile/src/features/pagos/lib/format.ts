import { enLima } from "@/lib/fecha-lima";
import type { HojaPago, PagosFilters } from "../types";

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function parseDate(iso: string | null): Date | null {
  if (!iso?.trim()) return null;
  const raw = enLima(iso).replace(" ", "T");
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const d = new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4] ?? 0),
      Number(m[5] ?? 0),
      Number(m[6] ?? 0),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatFecha(iso: string | null) {
  const d = parseDate(iso);
  if (!d) return "—";
  return `${pad2(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatFechaHora(iso: string | null) {
  const d = parseDate(iso);
  if (!d) return "—";
  return `${pad2(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatMoney(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatQty(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString("es-PE", { maximumFractionDigits: 2 });
}

export function localesLabel(locales: string[]) {
  if (!locales.length) return "Sin locales";
  if (locales.length === 1) return locales[0];
  if (locales.length === 2) return `${locales[0]} · ${locales[1]}`;
  return `${locales[0]} · ${locales[1]} · +${locales.length - 2}`;
}

export function createDefaultPagosFilters(): PagosFilters {
  return { search: "", fechaDesde: null, fechaHasta: null };
}

export function hasActivePagosFilters(filters: PagosFilters) {
  return Boolean(filters.search.trim() || filters.fechaDesde || filters.fechaHasta);
}

export function filterHojasClient(rows: HojaPago[], search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((item) => {
    const locales = item.localesNombres.join(" ").toLowerCase();
    return (
      item.conductorNombre.toLowerCase().includes(q) ||
      item.placa.toLowerCase().includes(q) ||
      item.operadorAcompanante.toLowerCase().includes(q) ||
      locales.includes(q)
    );
  });
}

export function isPdfPath(path: string) {
  return path.toLowerCase().endsWith(".pdf");
}

export function isImagePath(path: string) {
  const lower = path.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => lower.endsWith(ext));
}
