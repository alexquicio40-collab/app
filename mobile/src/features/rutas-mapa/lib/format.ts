import { asEstado, estadoRecojoLabel } from "@/features/routes/lib/estados-recojo";
import type { RouteItem } from "@/features/routes/types";

const COLORS: Record<string, string> = {
  programado: "#1976D2",
  en_ruta: "#FB8C00",
  llego: "#00897B",
  recolectado: "#2E7D32",
  no_recolectado: "#C62828",
  reprogramado: "#6A1B9A",
  cerrado: "#757575",
};

export function estadoLabel(estado: string) {
  return estadoRecojoLabel(estado);
}

export function estadoColor(estado: string) {
  return COLORS[asEstado(estado)] ?? "#455A64";
}

export function formatFechaEs(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function inicialNombre(nombre: string) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function hasCoords(ruta: RouteItem) {
  return ruta.localLatitud != null && ruta.localLongitud != null;
}

export function sortByOrden(a: RouteItem, b: RouteItem) {
  return (a.orden ?? 9999) - (b.orden ?? 9999);
}
