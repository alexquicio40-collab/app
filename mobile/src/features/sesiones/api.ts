import { api } from "@/lib/api";
import type { DispositivoInput, DispositivoItem, SesionItem } from "./types";

export function fetchSesiones() {
  return api<{ sesiones: SesionItem[] }>("/api/sesiones").then((data) => data.sesiones ?? []);
}

export function fetchDispositivos() {
  return api<{ dispositivos: DispositivoItem[] }>("/api/dispositivos").then(
    (data) => data.dispositivos ?? [],
  );
}

export function cerrarSesionRemota(id: number) {
  return api<{ success: boolean }>(`/api/sesiones/${id}/cerrar`, {
    method: "POST",
    body: {},
  });
}

export function cerrarSesionesUsuario(usuarioId: number) {
  return api<{ success: boolean }>("/api/sesiones/cerrar-usuario", {
    method: "POST",
    body: { usuario_id: usuarioId },
  });
}

export function registrarDispositivo(input: DispositivoInput) {
  return api<{ success: boolean }>("/api/dispositivos", {
    method: "POST",
    body: input,
  });
}

export function autorizarDispositivo(id: number) {
  return api<{ success: boolean }>(`/api/dispositivos/${id}/autorizar`, {
    method: "POST",
    body: {},
  });
}

export function bloquearDispositivo(id: number) {
  return api<{ success: boolean }>(`/api/dispositivos/${id}/bloquear`, {
    method: "POST",
    body: {},
  });
}

export function eliminarDispositivo(id: number) {
  return api<{ success: boolean }>(`/api/dispositivos/${id}`, {
    method: "DELETE",
  });
}
