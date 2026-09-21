import { env } from "../../config/env.js";

type LegacyUser = {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
};

export async function loginAgainstLegacy(
  username: string,
  password: string,
): Promise<LegacyUser | null> {
  if (!env.LEGACY_LOGIN_URL) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(env.LEGACY_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: username, password }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      success?: boolean;
      user?: { id: number; nombre?: string; usuario?: string; rol?: string };
    };

    if (!data.success || !data.user?.id) return null;

    return {
      id: Number(data.user.id),
      nombre: data.user.nombre || data.user.usuario || username,
      usuario: data.user.usuario || username,
      rol: data.user.rol || "operador",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
