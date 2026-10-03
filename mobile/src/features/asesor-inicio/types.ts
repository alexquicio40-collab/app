export type GestionKind = "confirmar" | "coordinar" | "seguimiento";

export type GestionItem = {
  id: string;
  localId: string | null;
  nombre: string;
  distrito: string;
  kind: GestionKind;
  detalle: string;
  frecuencia: string;
  ultimoRecojo: string | null;
  volumen: number | null;
  telefono: string;
  fotoUrl: string | null;
};

export type AsesorKpis = {
  localesActivos: number;
  recojosCoordinar: number;
  seguimientos: number;
  nuevosMes: number;
};

export type AsesorMes = {
  localesActivos: number;
  sinProgramar: number;
  certPendientes: number;
  certEmitidosMes: number;
};

export type AsesorDash = {
  kpis: AsesorKpis;
  gestion: GestionItem[];
  gestionTotal: number;
  mes: AsesorMes;
};
