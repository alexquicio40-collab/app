import { isNetworkError } from "@/lib/offline/net";
import { enqueueUpload, listJobs } from "@/lib/offline/queue";
import { flushOfflineJobs } from "@/lib/offline/sync";
import type { FinalizarRutaInput } from "@/features/routes/flujo/types";

export { isNetworkError };

export async function listRecojos() {
  const jobs = await listJobs();
  return jobs.filter((job) => job.path.includes("/finalizar"));
}

export async function enqueueRecojo(item: {
  rutaId: string;
  localNombre: string;
  input: FinalizarRutaInput;
}) {
  const files = [];
  if (item.input.fotoGuia?.uri) {
    files.push({
      field: "foto_guia",
      uri: item.input.fotoGuia.uri,
      name: item.input.fotoGuia.name,
      type: item.input.fotoGuia.mimeType || "image/jpeg",
    });
  }
  if (item.input.fotoMercaderia?.uri) {
    files.push({
      field: "foto_mercaderia",
      uri: item.input.fotoMercaderia.uri,
      name: item.input.fotoMercaderia.name,
      type: item.input.fotoMercaderia.mimeType || "image/jpeg",
    });
  }
  if (item.input.fotoPago?.uri) {
    files.push({
      field: "foto_pago",
      uri: item.input.fotoPago.uri,
      name: item.input.fotoPago.name,
      type: item.input.fotoPago.mimeType || "image/jpeg",
    });
  }
  await enqueueUpload({
    method: "POST",
    path: `/api/rutas/${item.rutaId}/finalizar`,
    fields: {
      estado: "recolectado",
      cantidad_litraje: String(Math.max(0, Math.floor(item.input.cantidadLitraje) || 0)),
      cantidad_baldes_vacios: String(Math.max(0, Math.floor(item.input.cantidadBaldesVacios) || 0)),
      cantidad_galoneras_vacias: String(
        Math.max(0, Math.floor(item.input.cantidadGalonerasVacias) || 0),
      ),
      observaciones: item.input.observaciones.trim(),
    },
    files,
  });
}

export async function flushRecojos() {
  return flushOfflineJobs();
}

export { subscribeJobs as subscribeRecojos } from "@/lib/offline/queue";
