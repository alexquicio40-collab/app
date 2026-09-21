import type { RouteItem } from "@/features/routes/types";
import type { LatLng } from "@/features/routes/navegacion/types";

export type CampoRoute = RouteItem;

export type CampoMapFocus = {
  origin: LatLng | null;
  dest: LatLng | null;
};
