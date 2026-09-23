import type { PermissionGrant, PermissionKind } from "../types";
import { Platform } from "react-native";

function mapStatus(granted: boolean | null | undefined): PermissionGrant {
  if (granted == null) return "unavailable";
  return granted ? "granted" : "denied";
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
