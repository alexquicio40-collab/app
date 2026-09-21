export type ReportPeriodo = "dia" | "semana" | "mes" | "personalizado";

export type ReportFilters = {
  periodo: ReportPeriodo;
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string;
  conductorId: string | null;
};

export type EnvasesTotales = {
  litros: number;
  baldes: number;
  galoneras: number;
};

export type RutasConteo = {
  total: number;
  pendiente: number;
  enProceso: number;
  enRuta: number;
  completada: number;
  cancelada: number;
  cumplimientoPct: number;
};

export type ConductorAgg = {
  id: string;
  nombre: string;
  total: number;
  pendiente: number;
  enProceso: number;
  enRuta: number;
  completada: number;
  cancelada: number;
  litros: number;
  baldes: number;
  galoneras: number;
};

export type LocalAgg = {
  id: string;
  nombre: string;
  total: number;
  completada: number;
  pendiente: number;
  cancelada: number;
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
  porLocal: LocalAgg[];
  plantaPorAsesor: PlantaAsesorAgg[];
  plantaPorProveedor: PlantaProveedorAgg[];
  plantaDetalle: PlantaDetalleItem[];
  plantaTotalSinFiltro: number;
};
