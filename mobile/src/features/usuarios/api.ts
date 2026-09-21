import { api } from "@/lib/api";
import { emptyPermisosMenu, parsePermisosMenu, permisosMenuToBackend } from "./lib/roles";
import type {
  UsuarioFormInput,
  UsuarioItem,
  UsuarioPermisosInput,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRows(payload: unknown, ...keys: string[]): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) return nested.filter(isRecord);
    }
  }
  return [];
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    const next = String(value).trim();
    if (next) return next;
  }
  return "";
}

function bool(value: unknown) {
  return value === 1 || value === true || value === "1" || value === "true";
}

export function parseUsuario(row: UnknownRecord): UsuarioItem | null {
  const id = text(row.id);
  if (!id) return null;

  return {
    id,
    nombre: text(row.nombre) || `Usuario ${id}`,
    usuario: text(row.usuario, row.login, row.username),
    rol: text(row.rol) || "operador",
    activo: row.activo == null ? true : bool(row.activo),
    dni: text(row.dni),
    placa: text(row.placa),
    requiereLitraje: bool(row.requiere_litraje),
    requiereBaldesVacios: bool(row.requiere_baldes_vacios),
    requiereGalonerasVacias: bool(row.requiere_galoneras_vacias),
    requiereFotoGuia: bool(row.requiere_foto_guia),
    requiereFotoMercaderia: bool(row.requiere_foto_mercaderia),
    requiereNotas: bool(row.requiere_notas),
    permisosMenu: parsePermisosMenu(row.permisos_menu),
  };
}

function toBody(input: UsuarioFormInput, includePassword: boolean) {
  const body: Record<string, unknown> = {
    nombre: input.nombre.trim(),
    usuario: input.usuario.trim(),
    rol: input.rol,
    activo: input.activo ? 1 : 0,
    dni: input.dni?.trim() || null,
    placa: input.placa?.trim() || null,
    requiere_litraje: Boolean(input.requiereLitraje),
    requiere_baldes_vacios: Boolean(input.requiereBaldesVacios),
    requiere_galoneras_vacias: Boolean(input.requiereGalonerasVacias),
    requiere_foto_guia: Boolean(input.requiereFotoGuia),
    requiere_foto_mercaderia: Boolean(input.requiereFotoMercaderia),
    requiere_notas: Boolean(input.requiereNotas),
  };
  if (includePassword && input.password?.trim()) {
    body.password = input.password.trim();
  }
  return body;
}

export async function fetchUsuarios(): Promise<UsuarioItem[]> {
  const payload = await api<unknown>("/api/users");
  return asRows(payload, "usuarios", "users")
    .map(parseUsuario)
    .filter((item): item is UsuarioItem => Boolean(item))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function fetchUsuario(id: string): Promise<UsuarioItem | null> {
  const payload = await api<unknown>(`/api/users/${id}`);
  if (!isRecord(payload)) return null;
  const nested = payload.user ?? payload.usuario ?? payload.data ?? payload;
  if (!isRecord(nested)) return null;
  return parseUsuario(nested);
}

export async function checkUsuarioExists(usuario: string, excludeId?: string) {
  const qs = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : "";
  const payload = await api<{ exists?: boolean }>(
    `/api/users/check-usuario/${encodeURIComponent(usuario.trim())}${qs}`,
  ).catch(() => ({ exists: false }));
  return Boolean(payload.exists);
}

export async function createUsuario(input: UsuarioFormInput) {
  return api<{ success?: boolean }>("/api/users", {
    method: "POST",
    body: toBody(input, true),
  });
}

export async function updateUsuario(id: string, input: UsuarioFormInput) {
  return api<{ success?: boolean }>(`/api/users/${id}`, {
    method: "PUT",
    body: toBody(input, Boolean(input.password?.trim())),
  });
}

export async function updateUsuarioActivo(user: UsuarioItem, activo: boolean) {
  return api<{ success?: boolean }>(`/api/users/${user.id}`, {
    method: "PUT",
    body: {
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      activo: activo ? 1 : 0,
      dni: user.dni || null,
      placa: user.placa || null,
      requiere_litraje: user.requiereLitraje,
      requiere_baldes_vacios: user.requiereBaldesVacios,
      requiere_galoneras_vacias: user.requiereGalonerasVacias,
      requiere_foto_guia: user.requiereFotoGuia,
      requiere_foto_mercaderia: user.requiereFotoMercaderia,
      requiere_notas: user.requiereNotas,
    },
  });
}

export async function updateUsuarioPermisos(user: UsuarioItem, input: UsuarioPermisosInput) {
  return api<{ success?: boolean }>(`/api/users/${user.id}`, {
    method: "PUT",
    body: {
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      activo: user.activo ? 1 : 0,
      dni: user.dni || null,
      placa: user.placa || null,
      requiere_litraje: input.requiereLitraje,
      requiere_baldes_vacios: input.requiereBaldesVacios,
      requiere_galoneras_vacias: input.requiereGalonerasVacias,
      requiere_foto_guia: input.requiereFotoGuia,
      requiere_foto_mercaderia: input.requiereFotoMercaderia,
      requiere_notas: input.requiereNotas,
      permisos_menu: permisosMenuToBackend(input.permisosMenu),
    },
  });
}

export async function deleteUsuario(id: string) {
  return api<{ success?: boolean }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export function defaultFormFromUser(user?: UsuarioItem | null): UsuarioFormInput {
  if (!user) {
    return {
      nombre: "",
      usuario: "",
      password: "",
      rol: "operador",
      activo: true,
      dni: "",
      placa: "",
      requiereLitraje: false,
      requiereBaldesVacios: false,
      requiereGalonerasVacias: false,
      requiereFotoGuia: false,
      requiereFotoMercaderia: false,
      requiereNotas: false,
    };
  }
  return {
    nombre: user.nombre,
    usuario: user.usuario,
    password: "",
    rol: user.rol,
    activo: user.activo,
    dni: user.dni,
    placa: user.placa,
    requiereLitraje: user.requiereLitraje,
    requiereBaldesVacios: user.requiereBaldesVacios,
    requiereGalonerasVacias: user.requiereGalonerasVacias,
    requiereFotoGuia: user.requiereFotoGuia,
    requiereFotoMercaderia: user.requiereFotoMercaderia,
    requiereNotas: user.requiereNotas,
  };
}

export { emptyPermisosMenu };
