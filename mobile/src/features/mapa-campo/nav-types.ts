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

export type CampoMapPayload = {
  type: "nav";
  tracking: boolean;
  position: LatLng | null;
  heading: number;
  dest: LatLng | null;
  selectedId: string | null;
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
