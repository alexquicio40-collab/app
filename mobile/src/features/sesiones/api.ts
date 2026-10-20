import { api } from "@/lib/api";
import { createListStore, fetchLive } from "@/lib/fast-data";
import type { DispositivoInput, DispositivoItem, SesionItem } from "./types";

const sesionesStore = createListStore<SesionItem>("sesiones");
const dispositivosStore = createListStore<DispositivoItem>("dispositivos");

export function peekSesiones() {
  return sesionesStore.peek();
}

export function peekDispositivos() {
  return dispositivosStore.peek();
}

export async function fetchSesiones(opts?: { force?: boolean }) {
  if (!opts?.force && sesionesStore.fresh()) {
    const cached = sesionesStore.peek();
    if (cached) return cached;
  }
  const data = await fetchLive<{ sesiones: SesionItem[] }>("/api/sesiones");
  const items = data.sesiones ?? [];
  sesionesStore.remember(items);
  return items;
}

export async function fetchDispositivos(opts?: { force?: boolean }) {
  if (!opts?.force && dispositivosStore.fresh()) {
    const cached = dispositivosStore.peek();
    if (cached) return cached;
  }
  const data = await fetchLive<{ dispositivos: DispositivoItem[] }>("/api/dispositivos");
  const items = data.dispositivos ?? [];
  dispositivosStore.remember(items);
  return items;
}

function invalidateSesiones() {
  sesionesStore.invalidate();
  dispositivosStore.invalidate();
}

export function cerrarSesionRemota(id: number) {
  return api<{ success: boolean }>(`/api/sesiones/${id}/cerrar`, {
    method: "POST",
    body: {},
  }).then((result) => {
    invalidateSesiones();
    return result;
  });
}

export function cerrarSesionesUsuario(usuarioId: number) {
  return api<{ success: boolean }>("/api/sesiones/cerrar-usuario", {
    method: "POST",
    body: { usuario_id: usuarioId },
  }).then((result) => {
    invalidateSesiones();
    return result;
  });
}

export function registrarDispositivo(input: DispositivoInput) {
  return api<{ success: boolean }>("/api/dispositivos", {
    method: "POST",
    body: input,
  }).then((result) => {
    invalidateSesiones();
    return result;
  });
}

export function autorizarDispositivo(id: number) {
  return api<{ success: boolean }>(`/api/dispositivos/${id}/autorizar`, {
    method: "POST",
    body: {},
  }).then((result) => {
    invalidateSesiones();
    return result;
  });
}

export function bloquearDispositivo(id: number) {
  return api<{ success: boolean }>(`/api/dispositivos/${id}/bloquear`, {
    method: "POST",
    body: {},
  }).then((result) => {
    invalidateSesiones();
    return result;
  });
}

export function eliminarDispositivo(id: number) {
  return api<{ success: boolean }>(`/api/dispositivos/${id}`, {
    method: "DELETE",
  }).then((result) => {
    invalidateSesiones();
    return result;
  });
}
