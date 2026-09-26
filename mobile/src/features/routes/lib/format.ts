import { getApiBaseUrl } from "@/lib/api";
import { enLima } from "@/lib/fecha-lima";
import { ESTADOS_RECOJO, estadoRecojoLabel, estadoRecojoTone } from "./estados-recojo";
import type { RouteEstado } from "../types";

export const LIMA_DISTRITOS = [
  "Ancón",
  "Ate",
  "Barranco",
  "Breña",
  "Carabayllo",
  "Chaclacayo",
  "Chorrillos",
  "Cieneguilla",
  "Comas",
  "El Agustino",
  "Independencia",
  "Jesús María",
  "La Molina",
  "La Victoria",
  "Lima",
  "Lince",
  "Los Olivos",
  "Lurigancho",
  "Lurín",
  "Magdalena del Mar",
  "Miraflores",
  "Pachacámac",
  "Pucusana",
  "Pueblo Libre",
  "Puente Piedra",
  "Punta Hermosa",
  "Punta Negra",
  "Rímac",
  "San Bartolo",
  "San Borja",
  "San Isidro",
  "San Juan de Lurigancho",
  "San Juan de Miraflores",
  "San Luis",
  "San Martín de Porres",
  "San Miguel",
  "Santa Anita",
  "Santa María del Mar",
  "Santa Rosa",
  "Santiago de Surco",
  "Surquillo",
  "Villa El Salvador",
  "Villa María del Triunfo",
] as const;

export const ESTADO_OPTIONS: { value: string; label: string }[] = ESTADOS_RECOJO.map((item) => ({
  value: item.value,
  label: item.label,
}));

export function estadoLabel(estado: RouteEstado) {
  return estadoRecojoLabel(estado);
}

export function estadoTone(estado: RouteEstado): "warn" | "info" | "ok" | "danger" | "muted" {
  return estadoRecojoTone(estado);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  // fecha_asignacion es un día de calendario (YYYY-MM-DD o medianoche UTC).
  // new Date("2026-09-25") es 00:00 UTC y en Lima se ve como el 24.
  const calendar = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (calendar) return `${calendar[3]}/${calendar[2]}/${calendar[1]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const raw = enLima(String(value).trim());
  const wall = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/.exec(raw);
  const midnightUtc = /T00:00:00(?:\.0+)?Z$/i.test(raw);
  if (!wall || midnightUtc) return formatDate(raw);
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    return `${wall[3]}/${wall[2]}/${wall[1]} ${wall[4]}:${wall[5]}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return formatDate(raw);
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
}

export function toDayKey(value?: string | null) {
  if (!value) return "";
  const raw = String(value).trim();
  // Asignaciones vienen como día calendario (YYYY-MM-DD o medianoche UTC).
  // No convertir a Lima: 2026-09-23T00:00:00Z sería 22/09 en Perú y el filtro las oculta.
  const calendar = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  if (calendar) return calendar[1]!;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}

export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
