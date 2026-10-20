import { fetchHistorial } from "@/features/certificados/api";
import { isPdfFile } from "@/features/certificados/lib/format";
import type { CertificadoHistorial } from "@/features/certificados/types";
import { fetchRutasDeLocal } from "@/features/routes/api";
import { estadoLabel, formatDate } from "@/features/routes/lib/format";
import type { RouteItem } from "@/features/routes/types";

export type GuiaMediaKind = "image" | "pdf";

export type GuiaRecojo = {
  id: string;
  fecha: string;
  fechaLabel: string;
  estado: string;
  operador: string;
  fotoGuia: string | null;
  fotoMercaderia: string | null;
  certificadoUrl: string | null;
  fotoGuiaKind: GuiaMediaKind | null;
  fotoMercaderiaKind: GuiaMediaKind | null;
  certificadoKind: GuiaMediaKind | null;
  origen: "ruta" | "certificado";
};

export function kindOfUrl(url: string | null | undefined): GuiaMediaKind | null {
  if (!url) return null;
  return isPdfFile("", url) ? "pdf" : "image";
}

function dayKey(value: string | null | undefined) {
  if (!value) return "";
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? value.slice(0, 10);
}

function fromRuta(item: RouteItem): GuiaRecojo {
  const fecha = item.fechaCompletada || item.fechaAsignacion;
  return {
    id: `ruta-${item.id}`,
    fecha,
    fechaLabel: formatDate(fecha),
    estado: estadoLabel(item.estado),
    operador: item.conductorNombre || "—",
    fotoGuia: item.fotoGuia,
    fotoMercaderia: item.fotoMercaderia,
    certificadoUrl: null,
    fotoGuiaKind: kindOfUrl(item.fotoGuia),
    fotoMercaderiaKind: kindOfUrl(item.fotoMercaderia),
    certificadoKind: null,
    origen: "ruta",
  };
}

function fromCert(item: CertificadoHistorial): GuiaRecojo {
  const fecha = item.rutaFechaCompletada || item.rutaFecha || item.createdAt || "";
  const url = item.archivoUrl || item.archivo || null;
  return {
    id: `cert-${item.id}`,
    fecha,
    fechaLabel: formatDate(fecha),
    estado: "Certificado",
    operador: item.conductorNombre || item.usuarioNombre || "—",
    fotoGuia: null,
    fotoMercaderia: null,
    certificadoUrl: url,
    fotoGuiaKind: null,
    fotoMercaderiaKind: null,
    certificadoKind: kindOfUrl(url),
    origen: "certificado",
  };
}

export async function loadGuiaRecojos(
  localId: string,
  localNombre: string,
): Promise<GuiaRecojo[]> {
  const nombre = localNombre.trim().toLowerCase();
  const [rutas, historial] = await Promise.all([
    fetchRutasDeLocal(localId).catch(() => [] as RouteItem[]),
    fetchHistorial({ fechaDesde: null, fechaHasta: null, localId }).catch(
      () => [] as CertificadoHistorial[],
    ),
  ]);

  const certs = historial.filter(
    (item) =>
      (item.localId && item.localId === localId) ||
      item.localNombre.trim().toLowerCase() === nombre,
  );

  const seen = new Set<string>();
  const out: GuiaRecojo[] = [];
  const push = (row: GuiaRecojo) => {
    const key = `${dayKey(row.fecha)}|${row.origen}|${row.operador}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(row);
  };

  for (const item of rutas) push(fromRuta(item));
  for (const item of certs) push(fromCert(item));

  const ranked = out.sort((a, b) => dayKey(b.fecha).localeCompare(dayKey(a.fecha)));
  const withMedia = ranked.filter(
    (row) => row.fotoGuia || row.fotoMercaderia || row.certificadoUrl,
  );
  return (withMedia.length ? withMedia : ranked).slice(0, 24);
}
