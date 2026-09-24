import { useAuth } from "@/providers/auth-provider";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import type { RouteItem } from "../types";
import {
  fetchFinalizacionConfig,
  finalizarRuta,
  llegarRuta,
  marcarNoRecolectado,
  reprogramarRuta,
  startRuta,
} from "./api";
import { emptyFinalizacionConfig } from "./lib/validate";
import { loadVehicleType, saveVehicleType } from "./lib/vehicle-store";
import type {
  FinalizacionConfig,
  FinalizarRutaInput,
  StartRutaPayload,
  VehicleType,
} from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

export function useRutaFlujo(onChanged?: () => void) {
  const { user } = useAuth();
  const isOperador = (user?.rol ?? "").toLowerCase() === "operador";

  const [startRoute, setStartRoute] = useState<RouteItem | null>(null);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [companionsOpen, setCompanionsOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [savedVehicle, setSavedVehicle] = useState<VehicleType | null>(null);

  const [finishRoute, setFinishRoute] = useState<RouteItem | null>(null);
  const [finishConfig, setFinishConfig] = useState<FinalizacionConfig>(emptyFinalizacionConfig);
  const [finishOpen, setFinishOpen] = useState(false);

  const [mutating, setMutating] = useState(false);

  const openStart = useCallback(async (route: RouteItem) => {
    setStartRoute(route);
    const saved = await loadVehicleType(route.id);
    setSavedVehicle(saved);
    setVehicleType(saved);
    setCompanionsOpen(false);
    setVehicleOpen(true);
  }, []);

  const closeStart = useCallback(() => {
    setVehicleOpen(false);
    setCompanionsOpen(false);
    setStartRoute(null);
    setVehicleType(null);
  }, []);

  const confirmVehicle = useCallback(
    async (type: VehicleType) => {
      if (!startRoute) return;
      await saveVehicleType(startRoute.id, type);
      setVehicleType(type);
      setSavedVehicle(type);
      setVehicleOpen(false);
      setCompanionsOpen(true);
    },
    [startRoute],
  );

  const runEstado = useCallback(
    async (route: RouteItem, action: (id: string) => Promise<unknown>, okTitle: string, okMessage: string) => {
      setMutating(true);
      try {
        await action(route.id);
        notify(okTitle, okMessage);
        onChanged?.();
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo actualizar el estado");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [onChanged],
  );

  const confirmStart = useCallback(
    async (payload: StartRutaPayload) => {
      if (!startRoute) return;
      setMutating(true);
      try {
        await saveVehicleType(startRoute.id, payload.vehicleType);
        await startRuta(startRoute.id);
        notify(
          "Ruta iniciada",
          payload.companions.length
            ? `Con ${payload.companions.join(", ")} · vehículo ${payload.vehicleType}`
            : `Vehículo ${payload.vehicleType}`,
        );
        closeStart();
        onChanged?.();
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo iniciar la ruta");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [startRoute, closeStart, onChanged],
  );

  const openFinish = useCallback(
    async (route: RouteItem) => {
      setFinishRoute(route);
      setFinishOpen(true);
      if (user?.id != null) {
        const config = await fetchFinalizacionConfig(user.id);
        setFinishConfig(config);
      } else {
        setFinishConfig(emptyFinalizacionConfig());
      }
    },
    [user?.id],
  );

  const closeFinish = useCallback(() => {
    setFinishOpen(false);
    setFinishRoute(null);
  }, []);

  const confirmFinish = useCallback(
    async (input: FinalizarRutaInput) => {
      if (!finishRoute) return;
      setMutating(true);
      try {
        await finalizarRuta(finishRoute.id, input);
        notify("Listo", "Ruta finalizada correctamente");
        closeFinish();
        onChanged?.();
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo finalizar");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [finishRoute, closeFinish, onChanged],
  );

  return {
    isOperador,
    mutating,
    // start
    startRoute,
    vehicleOpen,
    companionsOpen,
    vehicleType,
    savedVehicle,
    openStart,
    closeStart,
    confirmVehicle,
    confirmStart,
    arrive: (route: RouteItem) => runEstado(route, llegarRuta, "Llegó", "Quedó registrada la llegada"),
    skipCollection: (route: RouteItem) =>
      runEstado(route, marcarNoRecolectado, "No recolectado", "La visita quedó sin recojo"),
    reprogram: (route: RouteItem) =>
      runEstado(route, reprogramarRuta, "Reprogramado", "El recojo quedó reprogramado"),
    backToVehicle: () => {
      setCompanionsOpen(false);
      setVehicleOpen(true);
    },
    // finish
    finishRoute,
    finishOpen,
    finishConfig,
    openFinish,
    closeFinish,
    confirmFinish,
  };
}
