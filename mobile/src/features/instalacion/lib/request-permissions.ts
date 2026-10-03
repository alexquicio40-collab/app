import Constants from "expo-constants";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import type { PermissionGrant, PermissionKind } from "../types";

function mapStatus(granted: boolean | null | undefined): PermissionGrant {
  if (granted == null) return "unavailable";
  return granted ? "granted" : "denied";
}

function paquete() {
  return Constants.expoConfig?.android?.package || "com.ubicacionnewapp.app";
}

async function pedirNotificaciones(): Promise<PermissionGrant> {
  if (Platform.OS !== "android") return "unavailable";
  if (typeof Platform.Version === "number" && Platform.Version < 33) return "granted";
  const ok = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  ).catch(() => PermissionsAndroid.RESULTS.DENIED);
  return ok === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied";
}

async function leerNotificaciones(): Promise<PermissionGrant> {
  if (Platform.OS !== "android") return "unavailable";
  if (typeof Platform.Version === "number" && Platform.Version < 33) return "granted";
  const ok = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  ).catch(() => false);
  return ok ? "granted" : "denied";
}

async function pedirBateria(): Promise<PermissionGrant> {
  if (Platform.OS !== "android") return "unavailable";
  try {
    await Linking.sendIntent("android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS", [
      { key: "android.intent.extra.PACKAGE_NAME", value: paquete() },
    ]);
    return "granted";
  } catch {
    try {
      await Linking.sendIntent("android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS");
      return "granted";
    } catch {
      await Linking.openSettings();
      return "granted";
    }
  }
}

/**
 * Solicita un permiso nativo. En web no hay prompts equivalentes:
 * devolvemos `unavailable` y la UI permite continuar.
 */
export async function requestAppPermission(kind: PermissionKind): Promise<PermissionGrant> {
  if (Platform.OS === "web") return "unavailable";

  try {
    if (kind === "location") {
      const Location = await import("expo-location");
      const current = await Location.getForegroundPermissionsAsync();
      if (current.granted) return "granted";
      const asked = await Location.requestForegroundPermissionsAsync();
      return mapStatus(asked.granted);
    }

    if (kind === "locationBg") {
      const Location = await import("expo-location");
      const fg = await Location.getForegroundPermissionsAsync();
      if (!fg.granted) {
        const asked = await Location.requestForegroundPermissionsAsync();
        if (!asked.granted) return "denied";
      }
      const current = await Location.getBackgroundPermissionsAsync();
      if (current.granted) return "granted";
      const asked = await Location.requestBackgroundPermissionsAsync();
      return mapStatus(asked.granted);
    }

    if (kind === "notifications") return pedirNotificaciones();
    if (kind === "battery") return pedirBateria();

    const ImagePicker = await import("expo-image-picker");
    if (kind === "camera") {
      const current = await ImagePicker.getCameraPermissionsAsync();
      if (current.granted) return "granted";
      const asked = await ImagePicker.requestCameraPermissionsAsync();
      return mapStatus(asked.granted);
    }

    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) return "granted";
    const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return mapStatus(asked.granted);
  } catch {
    return "unavailable";
  }
}

export async function readAppPermission(kind: PermissionKind): Promise<PermissionGrant> {
  if (Platform.OS === "web") return "unavailable";

  try {
    if (kind === "location") {
      const Location = await import("expo-location");
      const current = await Location.getForegroundPermissionsAsync();
      return mapStatus(current.granted);
    }

    if (kind === "locationBg") {
      const Location = await import("expo-location");
      const current = await Location.getBackgroundPermissionsAsync();
      return mapStatus(current.granted);
    }

    if (kind === "notifications") return leerNotificaciones();
    if (kind === "battery") return "pending";

    const ImagePicker = await import("expo-image-picker");
    if (kind === "camera") {
      const current = await ImagePicker.getCameraPermissionsAsync();
      return mapStatus(current.granted);
    }

    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    return mapStatus(current.granted);
  } catch {
    return "unavailable";
  }
}
