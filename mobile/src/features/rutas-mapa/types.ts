import type { ConductorOption, RouteItem } from "@/features/routes/types";

export type { ConductorOption, RouteItem };

export type RutasMapaPin = {
  id: string;
  lat: number;
  lng: number;
  orden: number;
  color: string;
  label: string;
};

export type RutasMapaPayload = {
  pins: RutasMapaPin[];
  /** Polilínea en orden de visita (solo con un conductor seleccionado). */
  path: { lat: number; lng: number }[] | null;
  pathColor: string | null;
  selectedId: string | null;
  me: { lat: number; lng: number; accuracy?: number } | null;
};
