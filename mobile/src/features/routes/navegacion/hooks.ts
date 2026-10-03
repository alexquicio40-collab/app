import { readPreciseFix } from "@/features/map/lib/precise-location";
import { loadVehicleType } from "@/features/routes/flujo/lib/vehicle-store";
import type { RouteItem } from "@/features/routes/types";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { fetchSuggestedRoutes, loadNavRestrictions } from "./api";
import type { DirectionsResult, LatLng, SuggestedRoute, VehicleTypeNav } from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function getOrigin(): Promise<LatLng> {
  const fix = await readPreciseFix();
  return { lat: fix.lat, lng: fix.lng };
}

function findRoute(result: DirectionsResult | null, id: string | null): SuggestedRoute | null {
  if (!result || !id) return null;
  if (result.best.id === id) return result.best;
  return result.alternatives.find((item) => item.id === id) ?? null;
}

/** Preview de alternativas (lista Rutas). La navegación real vive en /mapa. */
export function useRouteNavegacion() {
  const [route, setRoute] = useState<RouteItem | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DirectionsResult | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleTypeNav | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setRoute(null);
    setResult(null);
    setError(null);
    setSelectedId(null);
    setOrigin(null);
  }, []);

  const openFor = useCallback(async (item: RouteItem) => {
    if (item.localLatitud == null || item.localLongitud == null) {
      notify("Sin coordenadas", "Este local no tiene ubicación en el mapa");
      return;
    }

    setRoute(item);
    setOpen(true);
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedId(null);

    try {
      const [pos, restrictions, savedVehicle] = await Promise.all([
        getOrigin(),
        loadNavRestrictions(),
        loadVehicleType(item.id),
      ]);
      setOrigin(pos);
      setVehicleType(savedVehicle);

      const directions = await fetchSuggestedRoutes({
        origin: pos,
        destination: { lat: item.localLatitud, lng: item.localLongitud },
        vehicleType: savedVehicle,
        restrictions,
      });
      setResult(directions);
      setSelectedId(directions.best.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo calcular la ruta");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAlternative = useCallback(
    (id: string) => {
      if (!findRoute(result, id)) return;
      setSelectedId(id);
    },
    [result],
  );

  const selected = findRoute(result, selectedId);

  return {
    open,
    route,
    loading,
    error,
    result,
    origin,
    vehicleType,
    selectedId,
    selected,
    openFor,
    close,
    selectAlternative,
    retry: () => (route ? void openFor(route) : undefined),
  };
}
