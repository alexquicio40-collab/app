export type LocalDuplicado = {
  id: string;
  nombre: string;
  direccion: string;
  ruc: string;
};

export function normalizarNombre(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function textoDuplicados(items: LocalDuplicado[]) {
  return items
    .map((item) => `• ${item.nombre}${item.direccion ? ` (${item.direccion})` : ""}`)
    .join("\n");
}
