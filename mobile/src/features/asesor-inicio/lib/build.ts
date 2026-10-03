import type { CertificadoHistorial, CertificadoPendiente } from "@/features/certificados/types";
import { portadaLocal } from "@/features/locales/api";
import type { LocalItem } from "@/features/locales/types";
import type { Recordatorio } from "@/features/programacion-alerta/types";
import { dia, hoy } from "@/lib/fecha-lima";
import { localesDelUsuario } from "@/lib/scope-user";
import type { AsesorDash, GestionItem } from "../types";

const GESTION_MAX = 8;

export function localesDelAsesor(
  locales: LocalItem[],
  user?: { id?: number; name?: string | null; username?: string | null; rol?: string } | null,
) {
  return localesDelUsuario(locales, user ?? null);
}

export function buildAsesorDash(
  locales: LocalItem[],
  recordatorios: Recordatorio[],
  pendientes: CertificadoPendiente[],
  historial: CertificadoHistorial[],
): AsesorDash {
  const activos = locales.filter((item) => item.activo);
  const sinProgramar = activos.filter((item) => item.frecuencias.length === 0);
  const nuevosMes = activos.filter((item) => esEsteMes(item.createdAt)).length;
  const certEmitidosMes = historial.filter((item) => esEsteMes(item.createdAt)).length;
  const gestion = armarGestion(activos, recordatorios, pendientes);

  return {
    kpis: {
      localesActivos: activos.length,
      recojosCoordinar: sinProgramar.length,
      seguimientos: pendientes.length,
      nuevosMes,
    },
    gestion: gestion.slice(0, GESTION_MAX),
    gestionTotal: gestion.length,
    mes: {
      localesActivos: activos.length,
      sinProgramar: sinProgramar.length,
      certPendientes: pendientes.length,
      certEmitidosMes,
    },
  };
}

function armarGestion(
  locales: LocalItem[],
  recordatorios: Recordatorio[],
  pendientes: CertificadoPendiente[],
): GestionItem[] {
  const byNombre = new Map(locales.map((item) => [norm(item.nombre), item]));
  const seen = new Set<string>();
  const out: GestionItem[] = [];

  const push = (item: GestionItem) => {
    const key = item.localId || norm(item.nombre);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };

  for (const rec of recordatorios) {
    const local = byNombre.get(norm(rec.localNombre));
    push({
      id: `rec-${rec.id}`,
      localId: local?.id ?? null,
      nombre: rec.localNombre || local?.nombre || "Local",
      distrito: distritoDe(local?.direccion || rec.localDireccion),
      kind: "confirmar",
      detalle: "Contactar para confirmar recojo",
      frecuencia: freqLabel(local?.frecuencias[0] || rec.frecuencia),
      ultimoRecojo: null,
      volumen: volumenDe(local),
      telefono: local?.encargadoTelefono || "",
      fotoUrl: portadaLocal(local),
    });
  }

  for (const local of locales) {
    if (local.frecuencias.length > 0) continue;
    push({
      id: `coord-${local.id}`,
      localId: local.id,
      nombre: local.nombre,
      distrito: distritoDe(local.direccion),
      kind: "coordinar",
      detalle: "Recojo pendiente de coordinación",
      frecuencia: "Sin frecuencia",
      ultimoRecojo: null,
      volumen: volumenDe(local),
      telefono: local.encargadoTelefono,
      fotoUrl: portadaLocal(local),
    });
  }

  for (const cert of pendientes) {
    const local = byNombre.get(norm(cert.nombre));
    push({
      id: `cert-${cert.id}`,
      localId: local?.id ?? cert.id,
      nombre: cert.nombre,
      distrito: distritoDe(local?.direccion || cert.direccion),
      kind: "seguimiento",
      detalle: "Seguimiento pendiente",
      frecuencia: freqLabel(local?.frecuencias[0] || ""),
      ultimoRecojo: cert.ultimaRutaCompletada,
      volumen: local ? volumenDe(local) : cert.cantidadEnvases || null,
      telefono: cert.telefonoEncargado || local?.encargadoTelefono || "",
      fotoUrl: portadaLocal(local),
    });
  }

  return out;
}

function esEsteMes(iso: string | null) {
  if (!iso) return false;
  const day = dia(iso);
  const now = hoy();
  return day.slice(0, 7) === now.slice(0, 7);
}

function distritoDe(direccion: string) {
  const parts = direccion
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || "";
}

function volumenDe(local?: LocalItem | null) {
  if (!local) return null;
  return local.bidonReal ?? local.cantidadEnvases ?? null;
}

function freqLabel(value: string) {
  const key = value.trim().toLowerCase();
  if (key === "semanal") return "Semanal";
  if (key === "quincenal") return "Quincenal";
  if (key === "mensual") return "Mensual";
  return value.trim() || "—";
}

function norm(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
