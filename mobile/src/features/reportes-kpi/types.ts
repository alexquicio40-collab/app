export type ReportPeriodo = "dia" | "semana" | "mes" | "personalizado";

export type ReportFilters = {
  periodo: ReportPeriodo;
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string;
  conductorId: string | null;
  asignadorId: string | null;
};

export type AsignadorOption = {
  id: string;
  nombre: string;
};

export type EnvasesTotales = {
  litros: number;
  baldes: number;
  galoneras: number;
};

export type RutasConteo = {
  total: number;
  programado: number;
  enRuta: number;
  llego: number;
  recolectado: number;
  noRecolectado: number;
  reprogramado: number;
  cerrado: number;
  cumplimientoPct: number;
};

export type ConductorAgg = {
  id: string;
  nombre: string;
  total: number;
  programado: number;
  enRuta: number;
  llego: number;
  recolectado: number;
  noRecolectado: number;
  reprogramado: number;
  cerrado: number;
  litros: number;
  baldes: number;
  galoneras: number;
};

export type AsignadorAgg = {
  id: string;
  nombre: string;
  asignadas: number;
  recolectadas: number;
  litros: number;
  baldes: number;
  galoneras: number;
};

export type RutaAsignadaItem = {
  id: string;
  fecha: string;
  asignador: string;
  conductor: string;
  local: string;
  estado: string;
  litros: number;
  baldes: number;
  galoneras: number;
};

export type LocalAgg = {
  id: string;
  nombre: string;
  total: number;
  recolectado: number;
  programado: number;
  cerrado: number;
};

export type PlantaAsesorAgg = {
  nombre: string;
  total: number;
  litros: number;
  baldes: number;
  galoneras: number;
};

export type PlantaProveedorAgg = {
  nombre: string;
  total: number;
  litros: number;
  baldes: number;
  galoneras: number;
};

export type PlantaDetalleItem = {
  id: string;
  ingreso: string | null;
  proveedor: string;
  asesor: string;
  guia: string;
  litros: number;
  baldes: number;
  galoneras: number;
  notas: string;
};

export type ReportSnapshot = {
  envasesRutas: EnvasesTotales;
  envasesPlanta: EnvasesTotales;
  envasesTotal: EnvasesTotales;
  rutas: RutasConteo;
  porConductor: ConductorAgg[];
  porAsignador: AsignadorAgg[];
  rutasAsignadas: RutaAsignadaItem[];
  porLocal: LocalAgg[];
  plantaPorAsesor: PlantaAsesorAgg[];
  plantaPorProveedor: PlantaProveedorAgg[];
  plantaDetalle: PlantaDetalleItem[];
  plantaTotalSinFiltro: number;
};
