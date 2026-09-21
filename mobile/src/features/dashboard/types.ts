export type DashboardSummary = {
  kpis: {
    operadores: number;
    enLinea: number;
    locales: number;
    rutasHoy: number;
    rutasPendientes: number;
    certificados: number;
  };
  rutasHoy: {
    pendientes: number;
    enProceso: number;
    completadas: number;
  };
  actividad: { fecha: string; puntos: number }[];
};

export type ModuleKey =
  | "mapa"
  | "rutas"
  | "hoja_ruta"
  | "rutas_mapa"
  | "locales"
  | "asignar_rutas"
  | "certificados"
  | "pagos"
  | "usuarios"
  | "operadores"
  | "planta"
  | "historial"
  | "estadisticas"
  | "reportes";

export type AppModule = {
  key: ModuleKey;
  label: string;
  hint: string;
  description: string;
  roles: string[];
  href:
    | "/"
    | "/mapa"
    | "/rutas"
    | "/modulos"
    | "/locales"
    | "/rutas-mapa"
    | "/usuarios"
    | "/operadores"
    | "/planta"
    | "/certificados"
    | "/pagos"
    | "/reportes-kpi"
    | "/hoja-ruta";
  /** Params de ruta (ej. tab de Rutas). */
  params?: Record<string, string>;
};
