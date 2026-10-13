import { isAdministrador, isAsesor } from "@/lib/role-nav";

export function canEditarLocal(local: { restringido?: boolean }, rol?: string | null) {
  if (isAdministrador(rol)) return true;
  if (isAsesor(rol)) return !local.restringido;
  return false;
}

export function canRestringirLocal(rol?: string | null) {
  return isAdministrador(rol);
}
