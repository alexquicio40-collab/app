import { enqueueUpload } from "@/lib/offline/queue";
import type { UploadFile } from "@/lib/offline/types";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

type LegacyRecojo = {
  rutaId?: string;
  input?: {
    cantidadLitraje?: number;
    cantidadBaldesVacios?: number;
    cantidadGalonerasVacias?: number;
    observaciones?: string;
    fotoGuia?: { uri: string; name: string; mimeType?: string } | null;
    fotoMercaderia?: { uri: string; name: string; mimeType?: string } | null;
    fotoPago?: { uri: string; name: string; mimeType?: string } | null;
  };
};

export async function migrateLegacyRecojos() {
  const items = await readLegacy();
  if (!items.length) return;
  for (const item of items) {
    if (!item.rutaId || !item.input) continue;
    const files: UploadFile[] = [];
    pushFoto(files, "foto_guia", item.input.fotoGuia);
    pushFoto(files, "foto_mercaderia", item.input.fotoMercaderia);
    pushFoto(files, "foto_pago", item.input.fotoPago);
    await enqueueUpload({
      method: "POST",
      path: `/api/rutas/${item.rutaId}/finalizar`,
      fields: {
        estado: "recolectado",
        cantidad_litraje: String(Math.max(0, Math.floor(item.input.cantidadLitraje ?? 0))),
        cantidad_baldes_vacios: String(Math.max(0, Math.floor(item.input.cantidadBaldesVacios ?? 0))),
        cantidad_galoneras_vacias: String(
          Math.max(0, Math.floor(item.input.cantidadGalonerasVacias ?? 0)),
        ),
        observaciones: item.input.observaciones?.trim() ?? "",
      },
      files,
    });
  }
  await clearLegacy();
}

function pushFoto(
  files: UploadFile[],
  field: string,
  foto?: { uri: string; name: string; mimeType?: string } | null,
) {
  if (!foto?.uri) return;
  files.push({
    field,
    uri: foto.uri,
    name: foto.name || `${field}.jpg`,
    type: foto.mimeType || "image/jpeg",
  });
}

async function readLegacy(): Promise<LegacyRecojo[]> {
  try {
    if (Platform.OS === "web") {
      const raw = globalThis.localStorage?.getItem("bioclim-recojos");
      return raw ? (JSON.parse(raw) as LegacyRecojo[]) : [];
    }
    const root = FileSystem.documentDirectory;
    if (!root) return [];
    const uri = `${root}recojos-cola.json`;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return [];
    return JSON.parse(await FileSystem.readAsStringAsync(uri)) as LegacyRecojo[];
  } catch {
    return [];
  }
}

async function clearLegacy() {
  try {
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem("bioclim-recojos");
      return;
    }
    const root = FileSystem.documentDirectory;
    if (!root) return;
    const uri = `${root}recojos-cola.json`;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}
