import type { AppModule } from "./types";

export const APP_MODULES: AppModule[] = [
  {
    key: "hoja_ruta",
    label: "Hoja ruta",
    hint: "Cierre",
    description: "Registra ventas,\ngastos y caja.",
    roles: ["operador", "chofer", "administrador"],
    href: "/hoja-ruta",
  },
  {
    key: "rutas_mapa",
    label: "Rutas mapa",
    hint: "Asignadas",
    description: "Ver rutas del día\nen el mapa.",
    roles: ["operador", "chofer", "administrador", "asesor"],
    href: "/rutas-mapa",
  },
  {
    key: "locales",
    label: "Locales",
    hint: "Clientes",
    description: "Gestiona puntos\nde recojo.",
    roles: ["asesor", "administrador"],
    href: "/locales",
  },
  {
    key: "certificados",
    label: "Certificados",
    hint: "Pendientes",
    description: "Atiende certificados\npor emitir.",
    roles: ["asesor", "administrador"],
    href: "/certificados",
  },
  {
    key: "pagos",
    label: "Pagos",
    hint: "Caja",
    description: "Controla cobros\ny movimientos.",
    roles: ["administrador"],
    href: "/pagos",
  },
  {
    key: "usuarios",
    label: "Usuarios",
    hint: "Accesos",
    description: "Administra cuentas\ny roles.",
    roles: ["administrador"],
    href: "/usuarios",
  },
  {
    key: "sesiones",
    label: "Sesiones",
    hint: "Acceso",
    description: "Dispositivos y\ncierre remoto.",
    roles: ["administrador"],
    href: "/sesiones",
  },
  {
    key: "mapa",
    label: "Mapa",
    hint: "Campo",
    description: "Navegación de campo\ny tus rutas del día.",
    roles: ["operador", "chofer", "conductor", "gerente"],
    href: "/mapa",
  },
  {
    key: "operadores",
    label: "Operadores",
    hint: "Flota",
    description: "Supervisión en vivo\nde la flota.",
    roles: ["administrador", "asesor", "gerente"],
    href: "/operadores",
  },
  {
    key: "planta",
    label: "Planta",
    hint: "Ingresos",
    description: "Registra ingresos\na planta.",
    roles: ["planta", "administrador"],
    href: "/planta",
  },
  {
    key: "historial",
    label: "Trazos",
    hint: "Historial",
    description: "Recorrido GPS,\nparadas y locales.",
    roles: ["operador", "chofer", "administrador", "asesor", "gerente"],
    href: "/historial",
  },
  {
    key: "estadisticas",
    label: "Stats",
    hint: "KPIs",
    description: "Mira indicadores\nde operación.",
    roles: ["administrador", "asesor"],
    href: "/reportes-kpi",
  },
  {
    key: "reportes",
    label: "Reportes",
    hint: "Bitácora",
    description: "Historial de todo\nlo que ocurre.",
    roles: ["administrador"],
    href: "/reportes",
  },
];

export function modulesForRole(rol?: string) {
  const role = (rol ?? "operador").toLowerCase();
  if (role === "administrador") return APP_MODULES;
  const effective = role === "chofer" || role === "conductor" ? "operador" : role;
  return APP_MODULES.filter((item) => item.roles.includes(effective) || item.roles.includes(role));
}
