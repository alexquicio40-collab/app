export type Recordatorio = {
  id: number;
  localNombre: string;
  localDireccion: string;
  conductorNombre: string;
  hora: string;
  frecuencia: string;
};

export type RecordatoriosHoy = {
  fecha: string;
  total: number;
  items: Recordatorio[];
};
