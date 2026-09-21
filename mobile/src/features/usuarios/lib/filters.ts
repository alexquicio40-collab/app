import type { UsuarioItem, UsuariosFilters } from "../types";

export function createDefaultUsuariosFilters(): UsuariosFilters {
  return { search: "", rol: null };
}

export function hasActiveUsuariosFilters(filters: UsuariosFilters) {
  return Boolean(filters.search.trim() || filters.rol);
}

export function filterUsuarios(rows: UsuarioItem[], filters: UsuariosFilters) {
  const q = filters.search.trim().toLowerCase();
  return rows
    .filter((item) => {
      if (filters.rol && item.rol !== filters.rol) return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.usuario.toLowerCase().includes(q) ||
        item.dni.toLowerCase().includes(q) ||
        item.placa.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, "es");
    });
}

export function inicialNombre(nombre: string) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}
