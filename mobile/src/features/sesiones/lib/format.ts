export function formatCuando(value?: string | null) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
}

export function matchQuery(blob: string, q: string) {
  if (!q) return true;
  return blob.toLowerCase().includes(q);
}
