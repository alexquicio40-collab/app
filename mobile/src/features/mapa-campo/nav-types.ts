import type { DirectionsResult, LatLng, SuggestedRoute } from "@/features/routes/navegacion/types";
import type { RouteItem } from "@/features/routes/types";

export type NavMapRoute = {
  id: string;
  coords: LatLng[];
  mid: LatLng | null;
  minsLabel: string;
  delta: string;
  trafficText: string;
  trafficTone: "ok" | "warn" | "bad";
};

export type CampoMapPin = {
  id: string;
  lat: number;
  lng: number;
  orden: number;
  color: string;
  label: string;
};

export type CampoMapPayload = {
  type: "nav";
  tracking: boolean;
  position: LatLng | null;
  heading: number;
  /** Radio GPS en metros (halo azul). */
  accuracy?: number | null;
  dest: LatLng | null;
  destColor?: string | null;
  selectedId: string | null;
  selectedPinId?: string | null;
  /** Cada toque de ruta/pin incrementa esto para enfocar el mapa. */
  focusToken?: number;
  pins?: CampoMapPin[];
  routes: NavMapRoute[];
  /** Tramo ya recorrido (no se recalcula). */
  traveled: LatLng[];
};

export type CampoNavState = {
  active: boolean;
  loading: boolean;
  recalculating: boolean;
  arrived: boolean;
  error: string | null;
  routeItem: RouteItem | null;
  result: DirectionsResult | null;
  selectedId: string | null;
  selected: SuggestedRoute | null;
  position: LatLng | null;
  heading: number;
  remainingMeters: number;
  etaSeconds: number;
  vehicleType: string | null;
};
