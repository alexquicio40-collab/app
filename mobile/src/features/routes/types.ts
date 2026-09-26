export type RouteEstado =
  | "programado"
  | "en_ruta"
  | "llego"
  | "recolectado"
  | "no_recolectado"
  | "reprogramado"
  | "cerrado"
  | string;

export type RouteMetodoPago = {
  id: number;
  nombre: string;
};

export type RouteItem = {
  id: string;
  conductorId: string;
  conductorNombre: string;
  creadoPorNombre: string;
  editadoPorNombre: string;
  localId: string;
  localNombre: string;
  localDireccion: string;
  localLatitud: number | null;
  localLongitud: number | null;
  fechaAsignacion: string;
  observaciones: string;
  estado: RouteEstado;
  orden: number | null;
  fechaCompletada: string | null;
  litraje: number | null;
  baldesVacios: number | null;
  galonerasVacias: number | null;
  fotoGuia: string | null;
  fotoMercaderia: string | null;
  encargadoNombre: string;
  encargadoTelefono: string;
  horarioEntrada: string;
  asesorBioClim: string;
  telefonoAsesor: string;
  referencia: string;
  /** Datos del local: qué recogerá el operador. */
  tipoEnvase: string;
  cantidadEnvases: number | null;
  cantidadBidonesAzules: number | null;
  cantidadBidonesBlancos: number | null;
  bidonPasadoPor: number | null;
  precioLitro: number | null;
  precioBalde: number | null;
  precioGalonera: number | null;
  operadoresVenPrecio: boolean;
  /** Formas de pago del local. */
  metodosPago: RouteMetodoPago[];
  prioridad: "alta" | "media" | "baja";
};

export type ConductorOption = {
  id: string;
  nombre: string;
};

export type RoutesFilters = {
  search: string;
  distrito: string | null;
  conductorId: string | null;
  estado: string | null;
  fechaDesde: string | null; // yyyy-MM-dd
  fechaHasta: string | null; // yyyy-MM-dd
};

export type RoutesCounts = {
  programado: number;
  enCurso: number;
  recolectado: number;
};
