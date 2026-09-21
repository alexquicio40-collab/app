import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { VehicleType } from "../types";

function keyFor(rutaId: string) {
  return `vehicleType_${rutaId}`;
}

async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function loadVehicleType(rutaId: string): Promise<VehicleType | null> {
  if (!rutaId) return null;
  const raw = await getItem(keyFor(rutaId));
  if (raw === "ligero" || raw === "pesado") return raw;
  return null;
}

export async function saveVehicleType(rutaId: string, type: VehicleType) {
  if (!rutaId) return;
  await setItem(keyFor(rutaId), type);
}
