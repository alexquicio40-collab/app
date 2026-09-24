export type CertEstado = "pendiente" | "ya emitido" | string;

export type LocalFoto = {
  id: string;
  localId: string;
  rutaArchivo: string;
  descripcion: string;
  orden: number;
};

/** Foto local pendiente de subir (galería / cámara). */
export type PendingLocalFoto = {
  key: string;
  uri: string;
  name: string;
  mimeType: string;
};

export type LocalItem = {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  horarioEntrada: string;
  asesorBioClim: string;
  telefonoAsesor: string;
  encargadoNombre: string;
  encargadoTelefono: string;
  referencia: string;
  ruc: string;
  razonSocial: string;
  necesitaCertificacion: boolean;
  estadoCertificacion: CertEstado | null;
  archivoCertificado: string | null;
  activo: boolean;
  tipoEnvase: string;
  cantidadEnvases: number | null;
  cantidadBidonesAzules: number | null;
  cantidadBidonesBlancos: number | null;
  bidonReal: number | null;
  bidonPasadoPor: number | null;
  frecuencias: string[];
  metodosPago: { id: number; nombre: string }[];
  fotos: LocalFoto[];
  prioridad: "alta" | "media" | "baja";
};

export type LocalFormInput = {
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  horarioEntrada?: string;
  asesorBioClim?: string;
  telefonoAsesor?: string;
  encargadoNombre?: string;
  encargadoTelefono?: string;
  referencia?: string;
  ruc?: string;
  razonSocial?: string;
  necesitaCertificacion: boolean;
  estadoCertificacion?: string | null;
  tipoEnvase?: string | null;
  cantidadEnvases?: number | null;
  cantidadBidonesAzules?: number | null;
  cantidadBidonesBlancos?: number | null;
  bidonReal?: number | null;
  bidonPasadoPor?: number | null;
  metodosPagoIds?: number[];
  prioridad?: "alta" | "media" | "baja";
  pendingFotos?: PendingLocalFoto[];
  removedFotoIds?: string[];
};

export type LocalesFilters = {
  search: string;
  distrito: string | null;
  certificacion: string | null;
  frecuencia: string | null;
  prioridad: string | null;
};

export type LocalesCounts = {
  total: number;
  necesitaCert: number;
  noNecesitaCert: number;
};
