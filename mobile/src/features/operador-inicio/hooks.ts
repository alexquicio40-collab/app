import { fetchHojasRuta, fetchUserPlaca } from "@/features/hoja-ruta/api";
import { fetchOperadorRutas } from "@/features/routes/api";
import type { RouteItem } from "@/features/routes/types";
import { esEmuladorAndroid, rutaDemoEmulador } from "@/lib/emulador";
import { hoy } from "@/lib/fecha-lima";
import { createStore } from "@/lib/fast-data";
import { useAuth } from "@/providers/auth-provider";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import { buildOperadorInicio } from "./lib/model";
import type { OperadorInicio } from "./types";

type OperadorSnap = { data: OperadorInicio; rutas: RouteItem[] };

const operadorStore = createStore<OperadorSnap>("operador-inicio");

export function useOperadorInicio() {
  const { user } = useAuth();
  const userId = user?.id != null ? String(user.id) : null;
  const cached = operadorStore.peek();
  const [data, setData] = useState<OperadorInicio | null>(() => cached?.data ?? null);
  const [rutas, setRutas] = useState<RouteItem[]>(() => cached?.rutas ?? []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(Boolean(cached));

  const reload = useCallback(
    async (silent = false) => {
      if (!userId) {
        setData(null);
        setRutas([]);
        setLoading(false);
        return;
      }
      const snap = operadorStore.peek();
      if (snap) {
        setData(snap.data);
        setRutas(snap.rutas);
        setLoading(false);
        hasData.current = true;
      } else if (!silent) {
        setLoading(true);
      }
      try {
        const fecha = hoy();
        const [fetchedRutas, placa, hojas, gps] = await Promise.all([
          fetchOperadorRutas(userId, fecha),
          fetchUserPlaca(userId).catch(() => ""),
          fetchHojasRuta({ fechaDesde: fecha, fechaHasta: fecha, conductorId: userId }).catch(
            () => [],
          ),
          leerGps().catch(() => ({ activo: false, fondo: false })),
        ]);
        const nextRutas =
          fetchedRutas.length || !esEmuladorAndroid() ? fetchedRutas : [rutaDemoEmulador()];
        const gastos = hojas.reduce((sum, item) => sum + (item.totalGastos || 0), 0);
        const next = buildOperadorInicio({
          rutas: nextRutas,
          placa,
          gastos,
          gpsActivo: gps.activo,
          gpsFondo: gps.fondo,
        });
        operadorStore.remember({ data: next, rutas: nextRutas }, true);
        setRutas(nextRutas);
        setData(next);
        hasData.current = true;
        setError(null);
      } catch (err) {
        if (esEmuladorAndroid() && !hasData.current) {
          const demo = [rutaDemoEmulador()];
          const next = buildOperadorInicio({
            rutas: demo,
            placa: "EMU-001",
            gastos: 0,
            gpsActivo: true,
          });
          operadorStore.remember({ data: next, rutas: demo }, true);
          setRutas(demo);
          setData(next);
          hasData.current = true;
          setError(null);
        } else if (!hasData.current) {
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
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { activo: false, fondo: false };
    }
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
