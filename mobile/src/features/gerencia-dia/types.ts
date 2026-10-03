export type PeriodoAdmin = "hoy" | "semana" | "mes" | "personalizado";

export type DeltaAdmin = {
  texto: string;
  sube: boolean;
};

export type CamionRendimiento = {
  id: string;
  nombre: string;
  litros: number;
  avance: number;
  enRuta: boolean;
};

export type MovimientoIcono = "drop" | "pin" | "truck" | "warn";

export type MovimientoAdmin = {
  id: string;
  titulo: string;
  detalle: string;
  hora: string;
  litros: number | null;
  icono: MovimientoIcono;
};

export type TopLocalAdmin = {
  id: string;
  nombre: string;
  litros: number;
};

export type AlertaAdmin = {
  id: string;
  tono: "peligro" | "aviso" | "info";
  titulo: string;
  detalle: string;
  hora: string;
};

export type EstadoLocalesAdmin = {
  total: number;
  atendidos: number;
  pendientes: number;
  noAtendidos: number;
  reprogramados: number;
};

export type AdminDash = {
  fecha: string;
  periodo: PeriodoAdmin;
  litros: number;
  deltaLitros: DeltaAdmin | null;
  localesAtendidos: number;
  localesPeriodo: number;
  cobertura: number;
  camionesActivos: number;
  camionesEnRuta: number;
  deltaCamiones: DeltaAdmin | null;
  compras: number;
  deltaCompras: DeltaAdmin | null;
  volumenMes: number;
  metaMensual: number | null;
  certificados: number | null;
  deltaCertificados: DeltaAdmin | null;
  localesEnMes: number;
  localesNuevos: number;
  incidencias: number;
  incidenciasAltas: number;
  deltaIncidencias: DeltaAdmin | null;
  estado: EstadoLocalesAdmin;
  camiones: CamionRendimiento[];
  movimientos: MovimientoAdmin[];
  topLocales: TopLocalAdmin[];
  alertas: AlertaAdmin[];
};
