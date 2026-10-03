import { api } from "@/lib/api";

export function anunciarDispositivo(input: {
  huella: string;
  codigo: string;
  nombre: string;
  plataforma: string;
}) {
  return api<{ autorizado: boolean; codigo?: string }>("/api/dispositivos/anunciar", {
    method: "POST",
    skipAuth: true,
    body: input,
  });
}

export function consultarDispositivo(input: { huella: string; codigo: string }) {
  const q = new URLSearchParams({ huella: input.huella, codigo: input.codigo });
  return api<{ autorizado: boolean; registrado?: boolean }>(`/api/dispositivos/estado?${q}`, {
    skipAuth: true,
  });
}
