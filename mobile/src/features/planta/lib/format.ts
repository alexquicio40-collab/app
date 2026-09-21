import type { PlantaFilters, PlantaRegistro } from "../types";

export function createDefaultPlantaFilters(): PlantaFilters {
  return { search: "", asesor: null, fechaDesde: null, fechaHasta: null };
}

export function hasActivePlantaFilters(filters: PlantaFilters) {
  return Boolean(
    filters.search.trim() || filters.asesor || filters.fechaDesde || filters.fechaHasta,
  );
}

function dayKey(iso: string | null) {
  const d = parseIngreso(iso);
  if (!d) return iso?.slice(0, 10) ?? null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function filterPlantaRegistros(rows: PlantaRegistro[], filters: PlantaFilters) {
  const q = filters.search.trim().toLowerCase();
  return rows
    .filter((item) => {
      if (filters.asesor && item.asesorComercial !== filters.asesor) return false;
      if (q) {
        const hit =
          item.nombreProveedor.toLowerCase().includes(q) ||
          item.guiaRetiro.toLowerCase().includes(q) ||
          item.asesorComercial.toLowerCase().includes(q);
        if (!hit) return false;
      }
      const day = dayKey(item.ingresoMercaderia);
      if (filters.fechaDesde && day && day < filters.fechaDesde) return false;
      if (filters.fechaHasta && day && day > filters.fechaHasta) return false;
      return true;
    })
    .sort((a, b) => {
      const da = a.ingresoMercaderia ?? "";
      const db = b.ingresoMercaderia ?? "";
      return db.localeCompare(da);
    });
}

/** Parsea ISO local o con Z sin depender del motor. */
export function parseIngreso(iso: string | null): Date | null {
  if (!iso?.trim()) return null;
  const raw = iso.trim();
  const m = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
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

/** Ej: 19 sep 2026, 13:31 */
export function formatIngreso(iso: string | null) {
  const d = parseIngreso(iso);
  if (!d) return iso?.trim() || "Sin fecha";
  return `${pad2(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Ej: 19 sep · 13:31 */
export function formatIngresoShort(iso: string | null) {
  const d = parseIngreso(iso);
  if (!d) return "—";
  return `${pad2(d.getDate())} ${MESES[d.getMonth()]} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function splitIngreso(iso: string | null): { date: string; time: string } {
  const d = parseIngreso(iso);
  if (!d) return { date: "", time: "" };
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

export function joinIngreso(date: string, time: string) {
  const d = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  const t = time.trim();
  if (!t) return `${d}T00:00:00`;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const hh = Number(m[1]);
  if (hh > 23) return "";
  return `${d}T${pad2(hh)}:${m[2]}:00`;
}

export function nowIsoLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}
