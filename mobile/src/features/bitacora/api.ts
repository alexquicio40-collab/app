import { api } from "@/lib/api";
import type { BitacoraEvento, BitacoraResumen } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    const next = String(value).trim();
    if (next) return next;
  }
  return "";
}

function num(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function emptyResumen(): BitacoraResumen {
  return {
    total: 0,
    crear: 0,
    editar: 0,
    eliminar: 0,
    ver: 0,
    registrar: 0,
    ingresar: 0,
    salir: 0,
    cerrar: 0,
    autorizar: 0,
    bloquear: 0,
  };
}

function parseEvento(row: UnknownRecord): BitacoraEvento | null {
  const id = num(row.id);
  if (!id) return null;
  return {
    id,
    cuando: text(row.cuando, row.creado_en),
    usuarioId: num(row.usuarioId, row.usuario_id) || null,
    usuario: text(row.usuario, row.usuario_nombre) || "Usuario",
    login: text(row.login, row.usuario_login),
    rol: text(row.rol),
    modulo: text(row.modulo) || "otros",
    accion: text(row.accion) || "ver",
    entidad: text(row.entidad),
    entidadId: text(row.entidadId, row.entidad_id) || null,
    resumen: text(row.resumen) || "Movimiento",
    metodo: text(row.metodo),
    path: text(row.path),
    status: num(row.status) || null,
    ip: text(row.ip) || null,
    agente: text(row.agente, row.user_agent) || null,
  };
}

export type BitacoraQuery = {
  desde: string;
  hasta: string;
  modulo?: string | null;
  accion?: string | null;
  q?: string;
};

export async function fetchBitacora(query: BitacoraQuery) {
  const search = new URLSearchParams();
  search.set("desde", query.desde);
  search.set("hasta", query.hasta);
  if (query.modulo) search.set("modulo", query.modulo);
  if (query.accion) search.set("accion", query.accion);
  if (query.q?.trim()) search.set("q", query.q.trim());
  search.set("limit", "200");

  const payload = await api<unknown>(`/api/bitacora?${search.toString()}`);
  if (!isRecord(payload)) return { eventos: [] as BitacoraEvento[], resumen: emptyResumen(), total: 0 };

  const raw = payload.eventos;
  const eventos = Array.isArray(raw)
    ? raw.filter(isRecord).map(parseEvento).filter((item): item is BitacoraEvento => Boolean(item))
    : [];

  const box = isRecord(payload.resumen) ? payload.resumen : {};
  const resumen: BitacoraResumen = {
    ...emptyResumen(),
    total: num(payload.total, box.total),
    crear: num(box.crear),
    editar: num(box.editar),
    eliminar: num(box.eliminar),
    ver: num(box.ver),
    registrar: num(box.registrar),
    ingresar: num(box.ingresar),
    salir: num(box.salir),
    cerrar: num(box.cerrar),
    autorizar: num(box.autorizar),
    bloquear: num(box.bloquear),
  };

  return { eventos, resumen, total: resumen.total };
}

export function registrarVista(modulo: string) {
  return api<{ success?: boolean }>("/api/bitacora/vista", {
    method: "POST",
    body: { modulo },
  }).catch(() => undefined);
}
