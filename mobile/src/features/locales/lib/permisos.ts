import { matchAsesorTag } from "@/lib/scope-user";
import { isAdministrador, isAsesor } from "@/lib/role-nav";

type LocalScope = {
  asesorBioClim?: string | null;
  restringido?: boolean;
};

type UserScope = {
  name?: string | null;
  username?: string | null;
  rol?: string | null;
} | null;

/** El local lo registró este asesor (o el usuario es admin). */
export function esLocalPropio(local: LocalScope, user?: UserScope) {
  if (!user) return false;
  if (isAdministrador(user.rol)) return true;
  return matchAsesorTag(local.asesorBioClim, user);
}

/**
 * Admin: edita todo.
 * Asesor: solo los que registró. Los de otro asesor son consulta.
 * Un local marcado restringido tampoco se edita (queda para el admin).
 */
export function canEditarLocal(local: LocalScope, user?: UserScope) {
  if (!user) return false;
  if (isAdministrador(user.rol)) return true;
  if (!isAsesor(user.rol)) return false;
  if (local.restringido) return false;
  return matchAsesorTag(local.asesorBioClim, user);
}

export function canRestringirLocal(rol?: string | null) {
  return isAdministrador(rol);
}
