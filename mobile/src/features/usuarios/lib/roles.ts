import type { MenuModuloKey, PermisosMenu, UsuarioRol } from "../types";

export const ROL_OPTIONS: { value: UsuarioRol; label: string }[] = [
  { value: "operador", label: "Operador" },
  { value: "chofer", label: "Chofer" },
  { value: "asesor", label: "Asesor" },
  { value: "gerente", label: "Gerente" },
  { value: "administrador", label: "Administrador" },
  { value: "planta", label: "Planta" },
];

export const ROL_FILTER_OPTIONS = [
  { value: "operador", label: "Operador" },
  { value: "chofer", label: "Chofer" },
  { value: "asesor", label: "Asesor" },
  { value: "administrador", label: "Administrador" },
  { value: "planta", label: "Planta" },
] as const;

export function esRolCampo(rol?: string | null) {
  const key = (rol ?? "").toLowerCase();
  return key === "operador" || key === "chofer" || key === "conductor";
}

export function rolLabel(rol: string) {
  const key = (rol ?? "").toLowerCase();
  if (key === "conductor") return "Chofer";
  return ROL_OPTIONS.find((item) => item.value === rol)?.label ?? (rol || "—");
}

export function vinculoOptions(
  usuarios: { id: string; nombre: string; rol: string; activo: boolean }[],
  currentId?: string | null,
) {
  const skip = currentId ? String(currentId) : "";
  return usuarios
    .filter((item) => esRolCampo(item.rol) && item.activo && String(item.id) !== skip)
    .sort((a, b) => {
      const byRol = rolLabel(a.rol).localeCompare(rolLabel(b.rol), "es");
      if (byRol) return byRol;
      return a.nombre.localeCompare(b.nombre, "es");
    })
    .map((item) => ({
      value: item.id,
      label: `${rolLabel(item.rol)} · ${item.nombre}`,
    }));
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
    case "chofer":
      return "#2E7D32";
    default:
      return "#455A64";
  }
}

export const MENU_MODULOS: { key: MenuModuloKey; label: string; group: string }[] = [
  { key: "usuarios", label: "Usuarios", group: "Administración" },
  { key: "sesiones", label: "Sesiones", group: "Administración" },
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

export function parsePermisosObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const decoded = JSON.parse(raw) as unknown;
      if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
        return decoded as Record<string, unknown>;
      }
    } catch {
      // ignore
    }
  }
  return {};
}

export function parsePermisosMenu(raw: unknown): PermisosMenu {
  const out = emptyPermisosMenu();
  const parsed = parsePermisosObject(raw);

  for (const [backendKey, value] of Object.entries(parsed)) {
    if (backendKey.startsWith("_")) continue;
    const appKey = (BACKEND_TO_APP[backendKey] ?? backendKey) as MenuModuloKey;
    if (!(appKey in out)) continue;
    out[appKey] = value === 1 || value === true || value === "1" || value === "true";
  }
  return out;
}

export type PermisosExtras = {
  localesIds: string[];
  vinculadoUsuarioId: string;
};

export function parsePermisosExtras(raw: unknown): PermisosExtras {
  const parsed = parsePermisosObject(raw);
  const localesIds = Array.isArray(parsed._locales)
    ? parsed._locales.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const vinculadoUsuarioId =
    parsed._vinculado == null ? "" : String(parsed._vinculado).trim();
  return { localesIds, vinculadoUsuarioId };
}

export function permisosMenuToBackend(permisos: PermisosMenu) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(permisos)) {
    out[APP_TO_BACKEND[key] ?? key] = Boolean(value);
  }
  return out;
}

export function permisosToBackend(permisos: PermisosMenu, extras: PermisosExtras) {
  const out = permisosMenuToBackend(permisos);
  out._locales = extras.localesIds;
  out._vinculado = extras.vinculadoUsuarioId || "";
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
