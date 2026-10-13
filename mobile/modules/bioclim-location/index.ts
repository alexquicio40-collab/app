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

/** Arranca el servicio nativo. Solo con la app visible: Android 12+ lo exige. */
export async function start(): Promise<boolean> {
  const mod = nativo();
  if (!mod) return false;
  try {
    return await mod.start();
  } catch {
    return false;
  }
}

export async function stop(): Promise<void> {
  const mod = nativo();
  if (!mod) return;
  try {
    await mod.stop();
  } catch {
    // ignore
  }
}

export function isRunning(): boolean {
  try {
    return nativo()?.isRunning() ?? false;
  } catch {
    return false;
  }
}
