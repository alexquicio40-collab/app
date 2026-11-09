export type PreciosLocal = {
  precioLitro: number | null;
  precioBalde: number | null;
  precioBalde18: number | null;
  precioBalde20: number | null;
  precioGalonera: number | null;
  operadoresVenPrecio: boolean;
};

export const emptyPrecios = (): PreciosLocal => ({
  precioLitro: null,
  precioBalde: null,
  precioBalde18: null,
  precioBalde20: null,
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

function balde18De(precios: Pick<PreciosLocal, "precioBalde" | "precioBalde18">) {
  return precios.precioBalde18 ?? precios.precioBalde ?? null;
}

export function hasPrecios(
  precios: Pick<PreciosLocal, "precioLitro" | "precioBalde" | "precioBalde18" | "precioBalde20" | "precioGalonera">,
) {
  return (
    precios.precioLitro != null ||
    balde18De(precios) != null ||
    precios.precioBalde20 != null ||
    precios.precioGalonera != null
  );
}

/** Admin/asesor siempre ven. Operador solo si el local lo permite y hay montos. */
export function canSeePrecios(
  precios: PreciosLocal,
  canManage: boolean,
) {
  if (!hasPrecios(precios)) return false;
  return canManage || precios.operadoresVenPrecio;
}

export function formatPrecios(
  precios: Pick<PreciosLocal, "precioLitro" | "precioBalde" | "precioBalde18" | "precioBalde20" | "precioGalonera">,
) {
  const parts: string[] = [];
  if (precios.precioLitro != null) parts.push(`${formatSoles(precios.precioLitro)} / L`);
  const balde18 = balde18De(precios);
  if (balde18 != null) parts.push(`${formatSoles(balde18)} / balde 18 L`);
  if (precios.precioBalde20 != null) parts.push(`${formatSoles(precios.precioBalde20)} / balde 20 L`);
  if (precios.precioGalonera != null) parts.push(`${formatSoles(precios.precioGalonera)} / gal.`);
  return parts.join(" · ");
}
