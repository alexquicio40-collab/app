import type { HistorialFilters, PendientesFilters } from "../types";

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
  const raw = iso.trim().replace(" ", "T");
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

/** Texto de ruta vinculada al certificado (id + fecha). */
export function formatRutaVinculada(rutaId: string | null, fecha: string | null) {
  const id = rutaId?.trim() || "";
  const when = fecha?.trim() ? formatFechaHora(fecha) : "";
  if (!id && (!when || when === "—")) return null;
  if (id && when && when !== "—") return `Ruta #${id} · ${when}`;
  if (id) return `Ruta #${id}`;
  return `Última ruta · ${when}`;
}

export function envaseTexto(input: {
  tipoEnvase: string;
  cantidadEnvases: number;
  cantidadBidonesAzules: number;
  cantidadBidonesBlancos: number;
}) {
  const t = input.tipoEnvase.trim().toLowerCase();
  if (!t) return "";
  if (t === "bidon" || t === "bidón") {
    return `Bidón · ${input.cantidadBidonesAzules} azules / ${input.cantidadBidonesBlancos} blancos`;
  }
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return input.cantidadEnvases > 0 ? `${cap} · ${input.cantidadEnvases}` : cap;
}

export function createDefaultPendientesFilters(): PendientesFilters {
  return { search: "", asesor: null, fechaDesde: null, fechaHasta: null };
}

export function createDefaultHistorialFilters(): HistorialFilters {
  return { search: "", fechaDesde: null, fechaHasta: null };
}

export function hasActivePendientesFilters(filters: PendientesFilters) {
  return Boolean(
    filters.search.trim() || filters.asesor || filters.fechaDesde || filters.fechaHasta,
  );
}

export function hasActiveHistorialFilters(filters: HistorialFilters) {
  return Boolean(filters.search.trim() || filters.fechaDesde || filters.fechaHasta);
}

export function countHistorialEsteMes(createdAts: (string | null)[]) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return createdAts.filter((iso) => {
    const d = parseDate(iso);
    return d != null && d.getFullYear() === y && d.getMonth() === m;
  }).length;
}

export function isPdfFile(tipoArchivo: string, archivo: string) {
  const t = tipoArchivo.toLowerCase();
  if (t === "pdf") return true;
  return archivo.toLowerCase().endsWith(".pdf");
}

export function isImageFile(tipoArchivo: string, archivo: string) {
  const t = tipoArchivo.toLowerCase();
  if (t === "imagen" || t === "image") return true;
  const lower = archivo.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => lower.endsWith(ext));
}
