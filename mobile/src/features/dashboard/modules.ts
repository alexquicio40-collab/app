import type { AppModule } from "./types";

export const APP_MODULES: AppModule[] = [
  {
    key: "hoja_ruta",
    label: "Hoja ruta",
    hint: "Cierre",
    description: "Registra ventas,\ngastos y caja.",
    roles: ["operador", "administrador"],
    href: "/hoja-ruta",
  },
  {
    key: "rutas_mapa",
    label: "Rutas mapa",
    hint: "Asignadas",
    description: "Ver rutas del día\nen el mapa.",
    roles: ["operador", "administrador", "asesor"],
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
    key: "mapa",
    label: "Mapa",
    hint: "Campo",
    description: "Navegación de campo\ny tus rutas del día.",
    roles: ["operador", "conductor", "gerente"],
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
    label: "Historial",
    hint: "Trazos",
    description: "Recorre visitas\ny recorridos.",
    roles: ["operador", "administrador"],
    href: "/modulos",
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
    hint: "Gestión",
    description: "Genera reportes\nde gestión.",
    roles: ["administrador"],
    href: "/modulos",
  },
];

export function modulesForRole(rol?: string) {
  const role = (rol ?? "operador").toLowerCase();
  if (role === "administrador") return APP_MODULES;
  return APP_MODULES.filter((item) => item.roles.includes(role));
}
