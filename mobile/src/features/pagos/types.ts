export type PagosTab = "pendientes" | "historial";

export type ComprobantePago = {
  id: string;
  rutaArchivo: string;
  archivoUrl: string;
  descripcion: string;
  createdBy: string | null;
  creadoPorNombre: string;
  createdAt: string | null;
};

export type HojaPago = {
  id: string;
  conductorId: string;
  conductorNombre: string;
  operadorAcompanante: string;
  placa: string;
  fecha: string | null;
  caja: number;
  totalGalones: number;
  totalBaldes: number;
  totalLitros: number;
  totalGastos: number;
  totalGeneral: number;
  vuelto: number;
  createdAt: string | null;
  comprobantesCount: number;
  localesNombres: string[];
};

export type PagosFilters = {
  search: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
};

export type PendingComprobanteFile = {
  key: string;
  uri: string;
  name: string;
  mimeType: string;
};

export type ComprobanteUploadInput = {
  file: PendingComprobanteFile;
  descripcion: string;
};
