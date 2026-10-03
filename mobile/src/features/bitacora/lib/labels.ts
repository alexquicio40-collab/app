import type { BitacoraAccion, BitacoraPeriodo } from "../types";
import { theme } from "@/lib/theme";

export const ACCION_LABEL: Record<string, string> = {
  crear: "Creó",
  editar: "Editó",
  eliminar: "Eliminó",
  ver: "Vio",
  registrar: "Registró",
  ingresar: "Ingresó",
  salir: "Salió",
  cerrar: "Cerró",
  autorizar: "Autorizó",
  bloquear: "Bloqueó",
};

export const ACCION_TONE: Record<string, { fg: string; bg: string }> = {
  crear: { fg: theme.colors.accent, bg: theme.colors.accentSoft },
  editar: { fg: theme.colors.info, bg: theme.colors.infoSoft },
  eliminar: { fg: theme.colors.danger, bg: theme.colors.dangerSoft },
  ver: { fg: theme.colors.muted, bg: theme.colors.cream },
  registrar: { fg: theme.colors.gold, bg: theme.colors.goldSoft },
  ingresar: { fg: theme.colors.accent, bg: theme.colors.accentSoft },
  salir: { fg: theme.colors.warn, bg: theme.colors.warnSoft },
  cerrar: { fg: theme.colors.warn, bg: theme.colors.warnSoft },
  autorizar: { fg: theme.colors.accent, bg: theme.colors.accentSoft },
  bloquear: { fg: theme.colors.danger, bg: theme.colors.dangerSoft },
};

export const MODULO_LABEL: Record<string, string> = {
  inicio: "Inicio",
  modulos: "Módulos",
  auth: "Acceso",
  locales: "Locales",
  rutas: "Rutas",
  usuarios: "Usuarios",
  sesiones: "Sesiones",
  operadores: "Operadores",
  mapa: "Mapa",
  rutas_mapa: "Rutas mapa",
  planta: "Planta",
  certificados: "Certificados",
  pagos: "Pagos",
  hoja_ruta: "Hoja ruta",
  estadisticas: "Stats",
  reportes: "Reportes",
  historial: "Historial",
  asignar: "Asignar",
  caja: "Caja",
  metodos_pago: "Métodos pago",
  restricciones: "Restricciones",
  otros: "Otros",
};

export const PERIODOS_FILTRO: { key: BitacoraPeriodo; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes", label: "30 días" },
  { key: "todo", label: "Todo" },
];

export const ACCIONES_FILTRO: { key: BitacoraAccion | ""; label: string }[] = [
  { key: "", label: "Todo" },
  { key: "crear", label: "Creó" },
  { key: "editar", label: "Editó" },
  { key: "eliminar", label: "Eliminó" },
  { key: "ver", label: "Vio" },
  { key: "registrar", label: "Registró" },
  { key: "ingresar", label: "Ingresó" },
  { key: "salir", label: "Salió" },
  { key: "cerrar", label: "Cerró" },
  { key: "autorizar", label: "Autorizó" },
  { key: "bloquear", label: "Bloqueó" },
];

export const MODULOS_FILTRO: { key: string; label: string }[] = [
  { key: "", label: "Todos" },
  ...Object.entries(MODULO_LABEL)
    .filter(([key]) => key !== "otros")
    .map(([key, label]) => ({ key, label })),
];

export function accionLabel(accion: string) {
  return ACCION_LABEL[accion] || accion;
}

export function moduloLabel(modulo: string) {
  return MODULO_LABEL[modulo] || modulo;
}

export function accionTone(accion: string) {
  return ACCION_TONE[accion] || ACCION_TONE.ver;
}

export function inicial(nombre: string) {
  const clean = nombre.trim();
  return clean ? clean.slice(0, 1).toUpperCase() : "?";
}
