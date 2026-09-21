export type OperatorRouteDetail = {
  id: string;
  localNombre: string;
  localDireccion: string;
  estado: string;
  latitud: number | null;
  longitud: number | null;
  horario: string;
  asesorNombre: string;
  asesorTelefono: string;
  encargadoNombre: string;
  encargadoTelefono: string;
  referencia: string;
  necesitaCertificacion: boolean;
  tipoEnvase: string;
  cantidadEnvases: number | null;
  cantidadBidonesAzules: number | null;
  cantidadBidonesBlancos: number | null;
  bidonPasadoPor: number | null;
  metodosPago: { id: number; nombre: string }[];
  fotos: string[];
};

export type OperatorDetailState = {
  operatorId: number;
  operatorName: string;
  speed: number;
  timestamp: string;
  onRoute: boolean;
  routes: OperatorRouteDetail[];
};
