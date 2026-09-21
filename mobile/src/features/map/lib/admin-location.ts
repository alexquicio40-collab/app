import { Platform } from "react-native";

export type AdminCoords = {
  lat: number;
  lng: number;
  accuracy: number;
};

/**
 * Obtiene la posición actual del administrador (web: Geolocation API; nativo: expo-location).
 */
export async function getAdminCoords(): Promise<AdminCoords> {
  if (Platform.OS === "web") {
    return readBrowserCoords();
  }
  return readNativeCoords();
}

function readBrowserCoords(): Promise<AdminCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalización no disponible"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.max(20, pos.coords.accuracy || 40),
        });
      },
      (err) => reject(new Error(err.message || "No se pudo obtener la ubicación")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 4000 },
    );
  });
}

async function readNativeCoords(): Promise<AdminCoords> {
  const Location = await import("expo-location");
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permiso de ubicación denegado");
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: Math.max(20, pos.coords.accuracy || 40),
  };
}
