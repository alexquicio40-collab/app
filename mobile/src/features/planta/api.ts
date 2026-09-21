import { api, apiUpload, getApiBaseUrl } from "@/lib/api";
import type { AsesorOption, PendingFoto, PlantaFormInput, PlantaRegistro } from "./types";

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

function num(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return 0;
}

function resolveMedia(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function parsePlantaRegistro(row: UnknownRecord): PlantaRegistro | null {
  const id = text(row.id);
  if (!id) return null;
  return {
    id,
    nombreProveedor: text(row.nombre_proveedor) || "Sin proveedor",
    asesorComercial: text(row.asesor_comercial),
    ingresoMercaderia: text(row.ingreso_mercaderia) || null,
    guiaRetiro: text(row.guia_retiro),
    cantidadLitraje: num(row.cantidad_litraje),
    cantidadBaldesVacios: num(row.cantidad_baldes_vacios),
    cantidadGalonerasVacias: num(row.cantidad_galoneras_vacias),
    notas: text(row.notas),
    fotoMercaderia: resolveMedia(text(row.foto_mercaderia) || null),
    fotoGuiaRetiro: resolveMedia(text(row.foto_guia_retiro) || null),
    createdAt: text(row.created_at) || null,
    updatedAt: text(row.updated_at) || null,
  };
}

async function appendFoto(form: FormData, field: string, foto?: PendingFoto | null) {
  if (!foto) return;
  if (foto.uri.startsWith("blob:") || foto.uri.startsWith("data:")) {
    const blob = await fetch(foto.uri).then((r) => r.blob());
    form.append(field, blob, foto.name);
    return;
  }
  form.append(field, {
    uri: foto.uri,
    name: foto.name,
    type: foto.mimeType || "image/jpeg",
  } as unknown as Blob);
}

async function buildFormData(input: PlantaFormInput) {
  const form = new FormData();
  form.append("nombre_proveedor", input.nombreProveedor.trim());
  form.append("asesor_comercial", input.asesorComercial.trim());
  form.append("ingreso_mercaderia", input.ingresoMercaderia.trim());
  form.append("guia_retiro", input.guiaRetiro.trim());
  form.append("cantidad_litraje", String(input.cantidadLitraje || 0));
  form.append("cantidad_baldes_vacios", String(input.cantidadBaldesVacios || 0));
  form.append("cantidad_galoneras_vacias", String(input.cantidadGalonerasVacias || 0));
  form.append("notas", input.notas.trim());
  await appendFoto(form, "foto_mercaderia", input.fotoMercaderia);
  await appendFoto(form, "foto_guia_retiro", input.fotoGuiaRetiro);
  return form;
}

export async function fetchPlantaRegistros(): Promise<PlantaRegistro[]> {
  const payload = await api<unknown>("/api/planta");
  return asRows(payload, "registros", "planta")
    .map(parsePlantaRegistro)
    .filter((item): item is PlantaRegistro => Boolean(item));
}

export async function fetchAsesores(): Promise<AsesorOption[]> {
  const payload = await api<unknown>("/api/asesores").catch(() => ({ asesores: [] }));
  const map = new Map<string, AsesorOption>();
  for (const row of asRows(payload, "asesores")) {
    const nombre = text(row.nombre);
    if (!nombre) continue;
    const id = text(row.id) || nombre;
    if (map.has(id)) continue;
    map.set(id, { id, nombre });
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function createPlantaRegistro(input: PlantaFormInput) {
  const form = await buildFormData(input);
  return apiUpload<unknown>("/api/planta", form, { method: "POST" });
}

export async function updatePlantaRegistro(id: string, input: PlantaFormInput) {
  const form = await buildFormData(input);
  return apiUpload<unknown>(`/api/planta/${id}`, form, { method: "PUT" });
}

export async function deletePlantaRegistro(id: string) {
  return api<{ success?: boolean }>(`/api/planta/${id}`, { method: "DELETE" });
}
