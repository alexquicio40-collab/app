export type InicioEstado = "sin_ruta" | "programada" | "en_progreso" | "completada";

export type InicioAccion = "mapa" | "caja" | "ninguna";

export type SiguienteLocal = {
  rutaId: string;
  posicion: number;
  total: number;
  nombre: string;
  direccion: string;
  horario: string;
  extra: string;
  inicial: string;
};

export type AvisoRuta = {
  id: string;
  titulo: string;
  detalle: string;
};

export type OperadorInicio = {
  fecha: string;
  actualizado: string;
  titulo: string;
  estado: InicioEstado;
  estadoLabel: string;
  locales: number;
  litros: number;
  atendidos: number;
  avance: number;
  placa: string;
  cargaTexto: string;
  siguiente: SiguienteLocal | null;
  tiempo: string;
  gastos: number;
  gpsActivo: boolean;
  gpsTitulo: string;
  gpsDetalle: string;
  accion: InicioAccion;
  accionTitulo: string;
  accionDetalle: string;
  avisos: AvisoRuta[];
};
