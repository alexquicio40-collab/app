import { getApiBaseUrl } from "@/lib/api";
import type { CertEstado } from "../types";

export const CERT_FILTER_OPTIONS = [
  { value: "pendiente", label: "Cert. pendiente" },
  { value: "emitido", label: "Cert. emitido" },
  { value: "necesita", label: "Necesita cert." },
  { value: "no_necesita", label: "Sin cert." },
] as const;

export const FREQ_FILTER_OPTIONS = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
] as const;

export const ENVASE_OPTIONS = [
  { value: "bidon", label: "Bidón" },
  { value: "cilindro", label: "Cilindro" },
] as const;

export type EnvaseTipo = (typeof ENVASE_OPTIONS)[number]["value"];

export function isBidonEnvase(tipo: string | null | undefined) {
  return tipo === "bidon";
}

export function envaseLabel(tipo: string | null | undefined) {
  if (!tipo) return "—";
  const found = ENVASE_OPTIONS.find((item) => item.value === tipo);
  return found?.label ?? tipo;
}

/** Resumen legible para ficha / listado (misma idea que Flutter). */
export function formatEnvaseSummary(local: {
  tipoEnvase?: string | null;
  cantidadEnvases?: number | null;
  cantidadBidonesAzules?: number | null;
  cantidadBidonesBlancos?: number | null;
  bidonReal?: number | null;
  bidonPasadoPor?: number | null;
}) {
  const tienePersonalizado = local.bidonReal != null || local.bidonPasadoPor != null;
  if (!local.tipoEnvase && local.cantidadEnvases == null && !tienePersonalizado) {
    return "No especificado";
  }

  const parts: string[] = [
    `Tipo: ${envaseLabel(local.tipoEnvase)}`,
    `Cantidad: ${local.cantidadEnvases ?? "—"}`,
  ];

  if (isBidonEnvase(local.tipoEnvase)) {
    parts.push(
      `Azules: ${local.cantidadBidonesAzules ?? "—"}, blancos: ${local.cantidadBidonesBlancos ?? "—"}`,
    );
  }

  if (tienePersonalizado) {
    parts.push(
      `Personalizado: real ${local.bidonReal ?? "—"} / pasado por ${local.bidonPasadoPor ?? "—"}`,
    );
  }

  return parts.join(" · ");
}

export function certLabel(necesita: boolean, estado: CertEstado | null) {
  if (!necesita) return "No necesita cert.";
  if (estado === "ya emitido") return "Certificado";
  if (estado === "pendiente") return "Cert. pendiente";
  return "Necesita cert.";
}

/** Amarillo = necesita cert. · Rojo = no necesita. */
export function certTone(necesita: boolean, _estado?: CertEstado | null): "needs" | "none" {
  return necesita ? "needs" : "none";
}

export function pinTone(necesita: boolean): "needs" | "none" {
  return necesita ? "needs" : "none";
}

export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
