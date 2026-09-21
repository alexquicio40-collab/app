import type { RouteItem } from "@/features/routes/types";

export function estadoLabel(estado: string) {
  switch (estado) {
    case "pendiente":
      return "Pendiente";
    case "en_proceso":
      return "En proceso";
    case "en_ruta":
      return "En ruta";
    case "completada":
      return "Completada";
    case "cancelada":
      return "Cancelada";
    default:
      return estado || "—";
  }
}

export function estadoColor(estado: string) {
  switch (estado) {
    case "pendiente":
      return "#1976D2";
    case "en_proceso":
    case "en_ruta":
      return "#FB8C00";
    case "completada":
      return "#2E7D32";
    case "cancelada":
      return "#757575";
    default:
      return "#455A64";
  }
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
