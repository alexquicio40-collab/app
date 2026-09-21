export type CertificadoTab = "pendientes" | "historial";

export type CertificadoPendiente = {
  id: string;
  nombre: string;
  direccion: string;
  ruc: string;
  razonSocial: string;
  encargadoTienda: string;
  telefonoEncargado: string;
  asesorBioClim: string;
  telefonoAsesor: string;
  tipoEnvase: string;
  cantidadEnvases: number;
  cantidadBidonesAzules: number;
  cantidadBidonesBlancos: number;
  estadoCertificacion: string | null;
  archivoCertificado: string | null;
  ultimaRutaCompletada: string | null;
  ultimaRutaId: string | null;
};

export type CertificadoHistorial = {
  id: string;
  localId: string | null;
  rutaAsignadaId: string | null;
  archivo: string;
  archivoUrl: string;
  tipoArchivo: string;
  observaciones: string;
  usuarioId: string | null;
  usuarioNombre: string;
  createdAt: string | null;
  localNombre: string;
  localDireccion: string;
  localRuc: string;
  localRazonSocial: string;
  rutaFecha: string | null;
  rutaFechaCompletada: string | null;
  conductorNombre: string;
};

export type PendientesFilters = {
  search: string;
  asesor: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
};

export type HistorialFilters = {
  search: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
};

export type PendingCertFile = {
  key: string;
  uri: string;
  name: string;
  mimeType: string;
};

export type CertUploadInput = {
  file: PendingCertFile;
  observaciones: string;
  rutaAsignadaId: string | null;
};
