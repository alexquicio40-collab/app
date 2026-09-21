export type PlantaRegistro = {
  id: string;
  nombreProveedor: string;
  asesorComercial: string;
  ingresoMercaderia: string | null;
  guiaRetiro: string;
  cantidadLitraje: number;
  cantidadBaldesVacios: number;
  cantidadGalonerasVacias: number;
  notas: string;
  fotoMercaderia: string | null;
  fotoGuiaRetiro: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PendingFoto = {
  key: string;
  uri: string;
  name: string;
  mimeType: string;
};

export type PlantaFormInput = {
  nombreProveedor: string;
  asesorComercial: string;
  ingresoMercaderia: string;
  guiaRetiro: string;
  cantidadLitraje: number;
  cantidadBaldesVacios: number;
  cantidadGalonerasVacias: number;
  notas: string;
  fotoMercaderia?: PendingFoto | null;
  fotoGuiaRetiro?: PendingFoto | null;
};

export type PlantaFilters = {
  search: string;
  asesor: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
};

export type AsesorOption = {
  id: string;
  nombre: string;
};
