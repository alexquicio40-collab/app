/** Helpers de rol para tabs Mapa vs Operadores (paridad Flutter). */
export function roleKey(rol?: string | null) {
  return (rol ?? "").toLowerCase();
}

export function canSeeOperadores(rol?: string | null) {
  const r = roleKey(rol);
  return r === "administrador" || r === "gerente" || r === "asesor";
}

export function canSeeMapaCampo(rol?: string | null) {
  const r = roleKey(rol);
  return r === "operador" || r === "conductor" || r === "gerente";
}

/** Tab principal del medio: Operadores (admin) o Mapa (operador). */
export function primaryMapTab(rol?: string | null): "operadores" | "mapa" {
  return canSeeOperadores(rol) && !canSeeMapaCampo(rol)
    ? "operadores"
    : canSeeMapaCampo(rol) && !canSeeOperadores(rol)
      ? "mapa"
      : canSeeOperadores(rol)
        ? "operadores"
        : "mapa";
}
