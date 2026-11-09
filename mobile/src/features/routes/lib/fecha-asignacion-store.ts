import { limaDate } from "@/lib/api";
import { getSecureItem, setSecureItem } from "@/lib/secure-store";

const KEY = "fecha_asignacion_v1";

function asDay(value: string | null | undefined) {
  const raw = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

export async function loadFechaAsignacion(): Promise<string> {
  try {
    const saved = asDay(await getSecureItem(KEY));
    if (saved) return saved;
  } catch {
    // Sin persistencia: hoy en Lima.
  }
  return limaDate();
}

export async function rememberFechaAsignacion(fecha: string) {
  const day = asDay(fecha) || limaDate();
  await setSecureItem(KEY, day);
  return day;
}
