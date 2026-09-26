import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function clave(fecha: string) {
  return `programacion-alerta:${fecha}`;
}

export async function wasDismissed(fecha: string) {
  if (!fecha) return false;
  const key = clave(fecha);
  if (Platform.OS === "web") return localStorage.getItem(key) === "1";
  return (await SecureStore.getItemAsync(key)) === "1";
}

export async function dismissRecordatorio(fecha: string) {
  if (!fecha) return;
  const key = clave(fecha);
  if (Platform.OS === "web") {
    localStorage.setItem(key, "1");
    return;
  }
  await SecureStore.setItemAsync(key, "1");
}
