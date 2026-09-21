/** Formatea cantidades del reporte (entero si cabe, si no 1 decimal). */
export function formatQty(n: number) {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatPct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  const rounded = Math.round(n * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}
