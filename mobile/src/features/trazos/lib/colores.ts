const PALETA = [
  "#0B5340",
  "#1E4D7B",
  "#C2410C",
  "#7C3AED",
  "#0E7490",
  "#B45309",
  "#BE185D",
  "#3F6212",
  "#4338CA",
  "#0369A1",
];

export function colorOperador(index: number) {
  return PALETA[index % PALETA.length] ?? "#0B5340";
}
