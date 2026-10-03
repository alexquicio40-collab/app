export type LocalOption = {
  id: string;
  nombre: string;
  direccion: string;
  asesorBioClim?: string;
};

export type ScheduleItem = {
  id: number;
  localId: string;
  conductorId: string;
  frecuencia: "semanal" | "quincenal" | "mensual" | string;
  diasSemana: string;
  diasMes: string;
  horaVisita: string;
  observaciones: string;
  activo: boolean;
  localNombre: string;
  conductorNombre: string;
};

export type RestrictionItem = {
  id: number;
  tipoVehiculo: string;
  nombre: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  activo: boolean;
};

export type AssignRouteInput = {
  conductorId: string;
  localId: string;
  fechaAsignacion: string;
  observaciones: string;
};

export type ScheduleInput = {
  localId: string;
  conductorId: string;
  frecuencia: string;
  diasSemana?: string;
  diasMes?: string;
  horaVisita?: string;
  observaciones?: string;
};

export type RestrictionInput = {
  tipoVehiculo: string;
  nombre: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type RoutesTabKey = "listado" | "asignacion" | "programacion" | "orden" | "restriccion";
