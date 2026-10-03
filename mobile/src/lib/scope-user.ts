import type { User } from "@/features/auth/types";
import { isAdministrador, roleKey } from "@/lib/role-nav";

export function seesAllUsers(rol?: string | null) {
  return isAdministrador(rol);
}

export function isRolCampo(rol?: string | null) {
  const key = roleKey(rol);
  return key === "operador" || key === "conductor";
}

export function normName(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** El texto de asesor del registro pertenece a este usuario. Sin fallback a todos. */
export function matchAsesorTag(
  tag?: string | null,
  user?: { name?: string | null; username?: string | null } | null,
) {
  const hay = normName(tag);
  if (!hay || !user) return false;
  const name = normName(user.name);
  const username = normName(user.username);
  if (hits(hay, name) || hits(hay, username)) return true;
  if (name) {
    const parts = name.split(" ").filter((part) => part.length >= 4);
    if (parts.length >= 2 && parts.every((part) => hay.includes(part))) return true;
  }
  return false;
}

type ScopeUser = {
  id?: number | string | null;
  name?: string | null;
  username?: string | null;
  rol?: string | null;
};

export function localesDelUsuario<T extends { asesorBioClim?: string | null }>(
  locales: T[],
  user?: ScopeUser | User | null,
) {
  if (!user) return [];
  if (seesAllUsers(user.rol)) return locales;
  return locales.filter((item) => matchAsesorTag(item.asesorBioClim, user));
}

export function clavesDeLocales(
  locales: { id?: string | null; nombre?: string | null; razonSocial?: string | null }[],
) {
  const ids = new Set<string>();
  const nombres = new Set<string>();
  for (const item of locales) {
    if (item.id) ids.add(item.id);
    const nombre = normName(item.nombre);
    const razon = normName(item.razonSocial);
    if (nombre) nombres.add(nombre);
    if (razon) nombres.add(razon);
  }
  return { ids, nombres };
}

/** Ruta o ingreso de planta pertenece a uno de los locales del usuario. */
export function esDeSusLocales(
  item: {
    localId?: string | null;
    localNombre?: string | null;
    nombreProveedor?: string | null;
  },
  claves: { ids: Set<string>; nombres: Set<string> },
) {
  if (item.localId && claves.ids.has(item.localId)) return true;
  const nombre = normName(item.localNombre || item.nombreProveedor);
  return Boolean(nombre && claves.nombres.has(nombre));
}

export function rutaDelUsuario<
  T extends {
    conductorId?: string | null;
    creadoPorId?: string | null;
    creadoPorNombre?: string | null;
    asesorBioClim?: string | null;
    localId?: string | null;
  },
>(route: T, user?: ScopeUser | User | null, localIds?: Set<string>) {
  if (!user) return false;
  if (seesAllUsers(user.rol)) return true;
  const uid = String(user.id);
  if (isRolCampo(user.rol)) return String(route.conductorId ?? "") === uid;
  if (route.creadoPorId && String(route.creadoPorId) === uid) return true;
  if (matchAsesorTag(route.asesorBioClim, user)) return true;
  if (matchAsesorTag(route.creadoPorNombre, user)) return true;
  if (route.localId && localIds?.has(route.localId)) return true;
  return false;
}

function hits(hay: string, needle: string) {
  if (!needle || needle.length < 3) return false;
  return hay === needle || hay.includes(needle) || needle.includes(hay);
}
