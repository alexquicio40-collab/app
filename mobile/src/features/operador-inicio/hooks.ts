import { fetchHojasRuta, fetchUserPlaca } from "@/features/hoja-ruta/api";
import { fetchOperadorRutas } from "@/features/routes/api";
import { hoy } from "@/lib/fecha-lima";
import { useAuth } from "@/providers/auth-provider";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import type { RouteItem } from "@/features/routes/types";
import { buildOperadorInicio } from "./lib/model";
import type { OperadorInicio } from "./types";

export function useOperadorInicio() {
  const { user } = useAuth();
  const userId = user?.id != null ? String(user.id) : null;
  const [data, setData] = useState<OperadorInicio | null>(null);
  const [rutas, setRutas] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);

  const reload = useCallback(
      async (silent = false) => {
      if (!userId) {
        setData(null);
        setRutas([]);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const fecha = hoy();
        const [rutas, placa, hojas, gps] = await Promise.all([
          fetchOperadorRutas(userId, fecha),
          fetchUserPlaca(userId).catch(() => ""),
          fetchHojasRuta({ fechaDesde: fecha, fechaHasta: fecha, conductorId: userId }).catch(() => []),
          leerGps().catch(() => ({ activo: false, fondo: false })),
        ]);
        const gastos = hojas.reduce((sum, item) => sum + (item.totalGastos || 0), 0);
        setRutas(rutas);
        setData(buildOperadorInicio({ rutas, placa, gastos, gpsActivo: gps.activo, gpsFondo: gps.fondo }));
        hasData.current = true;
        setError(null);
      } catch (err) {
        if (!hasData.current) {
          setError(err instanceof Error ? err.message : "No se pudo cargar tu ruta");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void reload(hasData.current);
    }, [reload]),
  );

  return { data, rutas, loading, error, reload };
}

async function leerGps() {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) return { activo: false, fondo: false };
    try {
      const status = await navigator.permissions?.query({ name: "geolocation" });
      return { activo: status?.state === "granted", fondo: false };
    } catch {
      return { activo: false, fondo: false };
    }
  }
  const Location = await import("expo-location");
  const { GPS_TASK } = await import("@/features/gps-fondo/task");
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== "granted") return { activo: false, fondo: false };
  const fondo = await Location.hasStartedLocationUpdatesAsync(GPS_TASK).catch(() => false);
  return { activo: true, fondo };
}
