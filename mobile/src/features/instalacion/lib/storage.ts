import { getSecureItem, removeSecureItem, setSecureItem } from "@/lib/secure-store";

const KEY = "instalacion_v1_done";

/** ¿Ya se completó la pantalla de instalación / permisos? */
export async function isInstalacionDone(): Promise<boolean> {
  const value = await getSecureItem(KEY);
  return value === "1";
}

export async function markInstalacionDone(): Promise<void> {
  await setSecureItem(KEY, "1");
}

/** Solo para pruebas / reset. */
export async function clearInstalacionDone(): Promise<void> {
  await removeSecureItem(KEY);
}
