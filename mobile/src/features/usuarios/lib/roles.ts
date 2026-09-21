import type { MenuModuloKey, PermisosMenu, UsuarioRol } from "../types";

export const ROL_OPTIONS: { value: UsuarioRol; label: string }[] = [
  { value: "operador", label: "Operador" },
  { value: "asesor", label: "Asesor" },
  { value: "gerente", label: "Gerente" },
  { value: "administrador", label: "Administrador" },
  { value: "planta", label: "Planta" },
];

export const ROL_FILTER_OPTIONS = [
  { value: "operador", label: "Operador" },
  { value: "asesor", label: "Asesor" },
  { value: "administrador", label: "Administrador" },
  { value: "planta", label: "Planta" },
] as const;

export function rolLabel(rol: string) {
  return ROL_OPTIONS.find((item) => item.value === rol)?.label ?? (rol || "—");
}

export function rolTone(rol: string): string {
  switch (rol) {
    case "administrador":
      return "#B42318";
    case "gerente":
      return "#8E24AA";
    case "asesor":
      return "#1976D2";
    case "planta":
      return "#FB8C00";
    case "operador":
    case "conductor":
      return "#2E7D32";
    default:
      return "#455A64";
  }
}

export const MENU_MODULOS: { key: MenuModuloKey; label: string; group: string }[] = [
  { key: "usuarios", label: "Usuarios", group: "Administración" },
  { key: "operadores", label: "Operadores", group: "Administración" },
  { key: "locales", label: "Locales", group: "Administración" },
  { key: "asignar", label: "Asignar rutas", group: "Administración" },
  { key: "rutas", label: "Rutas", group: "Administración" },
  { key: "certificados", label: "Certificados", group: "Administración" },
  { key: "pagos", label: "Pagos", group: "Administración" },
  { key: "reportes", label: "Reportes", group: "Administración" },
  { key: "reportes_rutas", label: "Reportes de rutas", group: "Administración" },
  { key: "estadisticas", label: "Estadísticas", group: "Administración" },
  { key: "historial", label: "Historial", group: "Administración" },
  { key: "historial_hr", label: "Historial hojas de ruta", group: "Administración" },
  { key: "planta", label: "Planta", group: "Planta" },
  { key: "mapa", label: "Mapa de campo", group: "Operador" },
  { key: "mapa_rutas", label: "Mapa de rutas", group: "Operador" },
  { key: "hoja_ruta", label: "Hoja de ruta", group: "Operador" },
];

export const MENU_MODULO_KEYS = MENU_MODULOS.map((item) => item.key);

const APP_TO_BACKEND: Record<string, string> = {
  operadores: "conductores",
  asignar: "asignar_rutas",
};

const BACKEND_TO_APP: Record<string, string> = {
  conductores: "operadores",
  asignar_rutas: "asignar",
};

export function emptyPermisosMenu(): PermisosMenu {
  const out = {} as PermisosMenu;
  for (const key of MENU_MODULO_KEYS) out[key] = false;
  return out;
}

export function parsePermisosMenu(raw: unknown): PermisosMenu {
  const out = emptyPermisosMenu();
  let parsed: Record<string, unknown> | null = null;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    parsed = raw as Record<string, unknown>;
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const decoded = JSON.parse(raw) as unknown;
      if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
        parsed = decoded as Record<string, unknown>;
      }
    } catch {
      // ignore
    }
  }

  if (!parsed) return out;

  for (const [backendKey, value] of Object.entries(parsed)) {
    const appKey = (BACKEND_TO_APP[backendKey] ?? backendKey) as MenuModuloKey;
    if (!(appKey in out)) continue;
    out[appKey] = value === 1 || value === true || value === "1" || value === "true";
  }
  return out;
}

export function permisosMenuToBackend(permisos: PermisosMenu) {
  const out: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(permisos)) {
    out[APP_TO_BACKEND[key] ?? key] = Boolean(value);
  }
  return out;
}

export const FINALIZACION_FLAGS = [
  { key: "requiereLitraje", label: "Litraje", api: "requiere_litraje" },
  { key: "requiereBaldesVacios", label: "Baldes vacíos", api: "requiere_baldes_vacios" },
  { key: "requiereGalonerasVacias", label: "Galoneras vacías", api: "requiere_galoneras_vacias" },
  { key: "requiereFotoGuia", label: "Foto guía", api: "requiere_foto_guia" },
  { key: "requiereFotoMercaderia", label: "Foto mercadería", api: "requiere_foto_mercaderia" },
  { key: "requiereNotas", label: "Notas", api: "requiere_notas" },
] as const;
