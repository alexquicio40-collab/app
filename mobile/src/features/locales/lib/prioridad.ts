/** Prioridad de proveedores. alta = rojo · media = amarillo · baja = verde */

export const PRIORIDADES = [
  { value: "alta", label: "Alta prioridad", color: "#E53935", soft: "#FDECEC" },
  { value: "media", label: "Media prioridad", color: "#F9A825", soft: "#FFF8E1" },
  { value: "baja", label: "Baja prioridad", color: "#2E7D32", soft: "#E8F5E9" },
] as const;

export type PrioridadProveedor = (typeof PRIORIDADES)[number]["value"];

export function normalizePrioridad(value: string | null | undefined): PrioridadProveedor {
  const code = String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (code === "alta" || code === "high" || code === "rojo") return "alta";
  if (code === "baja" || code === "low" || code === "verde") return "baja";
  return "media";
}

export function prioridadMeta(value: string | null | undefined) {
  const code = normalizePrioridad(value);
  return PRIORIDADES.find((item) => item.value === code) ?? PRIORIDADES[1];
}
