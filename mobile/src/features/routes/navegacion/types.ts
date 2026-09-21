export type LatLng = { lat: number; lng: number };

export type VehicleTypeNav = "ligero" | "pesado";

export type SuggestedRoute = {
  id: string;
  coords: LatLng[];
  durationSeconds: number;
  distMeters: number;
  trafficRatio: number | null;
  /** score = duration + (km * 45); menor = mejor (prioridad distancia corta). */
  score: number;
  label: string;
  isBest: boolean;
};

export type DirectionsResult = {
  best: SuggestedRoute;
  alternatives: SuggestedRoute[];
  message: string;
};

export type RestrictionBox = {
  tipoVehiculo: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  activo: boolean;
};
