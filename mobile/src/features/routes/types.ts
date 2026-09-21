export type RouteEstado = "pendiente" | "en_proceso" | "en_ruta" | "completada" | "cancelada" | string;

export type RouteMetodoPago = {
  id: number;
  nombre: string;
};

export type RouteItem = {
  id: string;
  conductorId: string;
  conductorNombre: string;
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
  /** Datos del local: qué recogerá el operador. */
  tipoEnvase: string;
  cantidadEnvases: number | null;
  cantidadBidonesAzules: number | null;
  cantidadBidonesBlancos: number | null;
  bidonPasadoPor: number | null;
  /** Formas de pago del local. */
  metodosPago: RouteMetodoPago[];
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
  pendiente: number;
  enProceso: number;
  completada: number;
};
