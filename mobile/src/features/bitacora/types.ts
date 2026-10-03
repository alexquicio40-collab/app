export type BitacoraAccion =
  | "crear"
  | "editar"
  | "eliminar"
  | "ver"
  | "registrar"
  | "ingresar"
  | "salir"
  | "cerrar"
  | "autorizar"
  | "bloquear";

export type BitacoraPeriodo = "hoy" | "semana" | "mes" | "todo";

export type BitacoraEvento = {
  id: number;
  cuando: string;
  usuarioId: number | null;
  usuario: string;
  login: string;
  rol: string;
  modulo: string;
  accion: BitacoraAccion | string;
  entidad: string;
  entidadId: string | null;
  resumen: string;
  metodo: string;
  path: string;
  status: number | null;
  ip: string | null;
  agente: string | null;
};

export type BitacoraResumen = {
  total: number;
  crear: number;
  editar: number;
  eliminar: number;
  ver: number;
  registrar: number;
  ingresar: number;
  salir: number;
  cerrar: number;
  autorizar: number;
  bloquear: number;
};

export type BitacoraFiltros = {
  periodo: BitacoraPeriodo;
  modulo: string | null;
  accion: string | null;
  q: string;
};

export type BitacoraGrupo = {
  dia: string;
  items: BitacoraEvento[];
};
