import { fetchHistorial } from "@/features/certificados/api";
import type { CertificadoHistorial } from "@/features/certificados/types";
import { fetchRutasDeLocal } from "@/features/routes/api";
import { estadoLabel, formatDate } from "@/features/routes/lib/format";
import type { RouteItem } from "@/features/routes/types";

export type GuiaRecojo = {
  id: string;
  fecha: string;
  fechaLabel: string;
  estado: string;
  operador: string;
  fotoGuia: string | null;
  fotoMercaderia: string | null;
  certificadoUrl: string | null;
  origen: "ruta" | "certificado";
};

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
    origen: "ruta",
  };
}

function fromCert(item: CertificadoHistorial): GuiaRecojo {
  const fecha = item.rutaFechaCompletada || item.rutaFecha || item.createdAt || "";
  return {
    id: `cert-${item.id}`,
    fecha,
    fechaLabel: formatDate(fecha),
    estado: "Certificado",
    operador: item.conductorNombre || item.usuarioNombre || "—",
    fotoGuia: null,
    fotoMercaderia: null,
    certificadoUrl: item.archivoUrl || item.archivo || null,
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
    fetchHistorial({ fechaDesde: null, fechaHasta: null }).catch(() => [] as CertificadoHistorial[]),
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

  return out
    .sort((a, b) => dayKey(b.fecha).localeCompare(dayKey(a.fecha)))
    .slice(0, 24);
}
