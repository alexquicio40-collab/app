export type PreciosLocal = {
  precioLitro: number | null;
  precioBalde: number | null;
  precioGalonera: number | null;
  operadoresVenPrecio: boolean;
};

export const emptyPrecios = (): PreciosLocal => ({
  precioLitro: null,
  precioBalde: null,
  precioGalonera: null,
  operadoresVenPrecio: false,
});

export function parseMoney(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function moneyText(value: number | null | undefined) {
  if (value == null) return "";
  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

export function formatSoles(value: number | null | undefined) {
  const text = moneyText(value);
  return text ? `S/ ${text}` : "";
}

export function hasPrecios(precios: Pick<PreciosLocal, "precioLitro" | "precioBalde" | "precioGalonera">) {
  return precios.precioLitro != null || precios.precioBalde != null || precios.precioGalonera != null;
}

/** Admin/asesor siempre ven. Operador solo si el local lo permite y hay montos. */
export function canSeePrecios(
  precios: PreciosLocal,
  canManage: boolean,
) {
  if (!hasPrecios(precios)) return false;
  return canManage || precios.operadoresVenPrecio;
}

export function formatPrecios(precios: Pick<PreciosLocal, "precioLitro" | "precioBalde" | "precioGalonera">) {
  const parts: string[] = [];
  if (precios.precioLitro != null) parts.push(`${formatSoles(precios.precioLitro)} / L`);
  if (precios.precioBalde != null) parts.push(`${formatSoles(precios.precioBalde)} / balde`);
  if (precios.precioGalonera != null) parts.push(`${formatSoles(precios.precioGalonera)} / gal.`);
  return parts.join(" · ");
}
