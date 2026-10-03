export type GpsPunto = {
  lat: number;
  lng: number;
  velocidad: number;
  kmh: number;
  at: number;
};

export type TrazoParada = {
  id: string;
  lat: number;
  lng: number;
  desde: number;
  hasta: number;
  minutos: number;
  localId: string | null;
  localNombre: string | null;
};

export type TrazoLocal = {
  id: string;
  rutaId: string;
  nombre: string;
  lat: number;
  lng: number;
  orden: number;
  estado: string;
  llego: number | null;
  salio: number | null;
  minutos: number;
};

export type TrazoSegmento = {
  a: { lat: number; lng: number };
  b: { lat: number; lng: number };
  kmh: number;
  color: string;
};

export type TrazoKpis = {
  puntos: number;
  km: number;
  duracionMin: number;
  paradoMin: number;
  moviendoMin: number;
  velMax: number;
  velProm: number;
  paradas: number;
  locales: number;
  visitados: number;
};

export type TrazoDia = {
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  inicio: number | null;
  fin: number | null;
  puntos: GpsPunto[];
  waypoints: { lat: number; lng: number; at?: number }[];
  segmentos: TrazoSegmento[];
  paradas: TrazoParada[];
  locales: TrazoLocal[];
  kpis: TrazoKpis;
};

export type HistorialResumen = {
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  puntos: number;
};

export type TrazoCapa = {
  id: string;
  nombre: string;
  color: string;
  path: { lat: number; lng: number }[];
  trazo: TrazoDia;
};

export type TrazoMapPayload = {
  path: { lat: number; lng: number }[];
  rutas: { id: string; color: string; path: { lat: number; lng: number }[]; nombre: string }[];
  waypoints: { lat: number; lng: number; at?: number }[];
  segmentos: TrazoSegmento[];
  paradas: {
    id: string;
    lat: number;
    lng: number;
    label: string;
    minutos: number;
  }[];
  locales: {
    id: string;
    lat: number;
    lng: number;
    orden: number;
    label: string;
    visitado: boolean;
  }[];
  inicio: { lat: number; lng: number } | null;
  fin: { lat: number; lng: number } | null;
  cursor: { lat: number; lng: number; kmh: number; heading: number } | null;
  selectedId: string | null;
};

export type TrazoEvento = {
  id: string;
  kind: "local" | "parada";
  titulo: string;
  detalle: string;
  at: number;
  minutos: number;
};
