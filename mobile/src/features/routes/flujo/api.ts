import { api, apiUpload } from "@/lib/api";
import { emptyFinalizacionConfig } from "./lib/validate";
import type { FinalizacionConfig, FinalizarRutaInput, PendingFoto } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function bool(value: unknown) {
  return value === 1 || value === true || value === "1" || value === "true";
}

function mergeConfig(raw: UnknownRecord): FinalizacionConfig {
  const cfg = { ...raw };
  let nested = raw.config;
  if (typeof nested === "string" && nested.trim()) {
    try {
      nested = JSON.parse(nested) as unknown;
    } catch {
      nested = null;
    }
  }
  if (isRecord(nested)) {
    for (const key of [
      "requiere_litraje",
      "requiere_baldes_vacios",
      "requiere_galoneras_vacias",
      "requiere_foto_guia",
      "requiere_foto_mercaderia",
      "requiere_notas",
    ]) {
      if (nested[key] != null) cfg[key] = nested[key];
    }
  }

  return {
    requiereLitraje: bool(cfg.requiere_litraje),
    requiereBaldesVacios: bool(cfg.requiere_baldes_vacios),
    requiereGalonerasVacias: bool(cfg.requiere_galoneras_vacias),
    requiereFotoGuia: bool(cfg.requiere_foto_guia),
    requiereFotoMercaderia: bool(cfg.requiere_foto_mercaderia),
    requiereNotas: bool(cfg.requiere_notas),
  };
}

/** Config de campos requeridos del operador (tabla usuarios). */
export async function fetchFinalizacionConfig(userId: string | number): Promise<FinalizacionConfig> {
  try {
    const payload = await api<unknown>(`/api/users/${userId}`);
    if (!isRecord(payload)) return emptyFinalizacionConfig();
    const nested = payload.user ?? payload.usuario ?? payload.data ?? payload;
    if (!isRecord(nested)) return emptyFinalizacionConfig();
    return mergeConfig(nested);
  } catch {
    return emptyFinalizacionConfig();
  }
}

export async function startRuta(rutaId: string) {
  return api<{ success?: boolean; message?: string }>(`/api/rutas/${rutaId}`, {
    method: "PUT",
    body: { estado: "en_proceso" },
  });
}

function appendFoto(form: FormData, field: string, foto: PendingFoto | null) {
  if (!foto) return;
  form.append(field, {
    uri: foto.uri,
    name: foto.name,
    type: foto.mimeType,
  } as unknown as Blob);
}

export async function finalizarRuta(rutaId: string, input: FinalizarRutaInput) {
  const form = new FormData();
  form.append("estado", "completada");
  form.append("cantidad_litraje", String(Math.max(0, Math.floor(input.cantidadLitraje) || 0)));
  form.append(
    "cantidad_baldes_vacios",
    String(Math.max(0, Math.floor(input.cantidadBaldesVacios) || 0)),
  );
  form.append(
    "cantidad_galoneras_vacias",
    String(Math.max(0, Math.floor(input.cantidadGalonerasVacias) || 0)),
  );
  form.append("observaciones", input.observaciones.trim());
  appendFoto(form, "foto_guia", input.fotoGuia);
  appendFoto(form, "foto_mercaderia", input.fotoMercaderia);

  return apiUpload<{ success?: boolean; message?: string }>(
    `/api/rutas/${rutaId}/finalizar`,
    form,
  );
}
