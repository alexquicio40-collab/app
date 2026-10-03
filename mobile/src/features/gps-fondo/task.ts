import { publishFix } from "@/features/gps-fondo/publish";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

export const GPS_TASK = "bioclim-gps-fondo";

if (Platform.OS !== "web") {
  TaskManager.defineTask(GPS_TASK, async ({ data, error }) => {
    try {
      if (error || !data) return;
      const locations = (data as { locations?: { coords: { latitude: number; longitude: number; speed: number | null } }[] }).locations ?? [];
      const last = locations[locations.length - 1];
      if (!last) return;
      await publishFix(last.coords.latitude, last.coords.longitude, last.coords.speed ?? 0);
    } catch {
      // Un error aquí no puede tumbar el servicio: Android cierra la app si falla seguido.
    }
  });
}
