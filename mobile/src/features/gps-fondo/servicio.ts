import { requireNativeModule } from "expo";
import { Platform } from "react-native";

type Native = {
  start(): Promise<boolean>;
  stop(): Promise<void>;
  isRunning(): boolean;
};

function nativo(): Native | null {
  if (Platform.OS !== "android") return null;
  try {
    return requireNativeModule<Native>("BioclimLocation");
  } catch {
    return null;
  }
}

export async function startServicioNativo(): Promise<boolean> {
  const mod = nativo();
  if (!mod) return false;
  try {
    return await mod.start();
  } catch {
    return false;
  }
}

export async function stopServicioNativo(): Promise<void> {
  const mod = nativo();
  if (!mod) return;
  try {
    await mod.stop();
  } catch {
    // ignore
  }
}

export function servicioNativoActivo(): boolean {
  try {
    return nativo()?.isRunning() ?? false;
  } catch {
    return false;
  }
}
