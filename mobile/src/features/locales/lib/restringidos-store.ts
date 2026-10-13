import { getSecureItem, setSecureItem } from "@/lib/secure-store";

const KEY = "locales_restringidos_v1";

export async function loadRestringidos(): Promise<Set<string>> {
  try {
    const raw = await getSecureItem(KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.map((id) => String(id)).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function rememberRestringido(id: string, on: boolean) {
  const next = await loadRestringidos();
  if (on) next.add(id);
  else next.delete(id);
  await setSecureItem(KEY, JSON.stringify([...next]));
}
