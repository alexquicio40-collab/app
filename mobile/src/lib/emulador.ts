import { Platform } from "react-native";

/** Solo AVD/genérico. Un teléfono real nunca entra aquí. */
export function esEmuladorAndroid() {
  if (Platform.OS !== "android") return false;
  const c = Platform.constants as { Fingerprint?: string; Model?: string; Brand?: string; Manufacturer?: string };
  const blob = [c.Fingerprint, c.Model, c.Brand, c.Manufacturer].join(" ").toLowerCase();
  return (
    blob.includes("generic") ||
    blob.includes("sdk_gphone") ||
    blob.includes("emulator") ||
    blob.includes("goldfish") ||
    blob.includes("ranchu")
  );
}
