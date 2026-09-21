/** Paleta estable por operador (misma idea que Flutter). */
export const CONDUCTOR_PALETTE = [
  "#1976D2",
  "#E53935",
  "#43A047",
  "#FB8C00",
  "#8E24AA",
  "#00ACC1",
  "#D81B60",
  "#FFB300",
  "#3949AB",
  "#EC407A",
] as const;

export function colorForConductor(conductorId: string, index: number) {
  if (!conductorId) return CONDUCTOR_PALETTE[0];
  return CONDUCTOR_PALETTE[index % CONDUCTOR_PALETTE.length];
}

export function buildConductorColorMap(conductorIds: string[]) {
  const map = new Map<string, string>();
  conductorIds.forEach((id, index) => {
    map.set(id, colorForConductor(id, index));
  });
  return map;
}
