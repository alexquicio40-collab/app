import { RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

export type DashboardSummary = {
  kpis: {
    operadores: number;
    enLinea: number;
    locales: number;
    rutasHoy: number;
    rutasPendientes: number;
    certificados: number;
  };
  rutasHoy: {
    pendientes: number;
    enProceso: number;
    completadas: number;
  };
  actividad: { fecha: string; puntos: number }[];
};

async function scalar(sql: string, params: Record<string, unknown> = {}) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

async function rows<T extends RowDataPacket>(sql: string, params: Record<string, unknown> = {}) {
  try {
    const [result] = await pool.query<T[]>(sql, params);
    return result;
  } catch {
    return [] as T[];
  }
}

export async function getSummary(): Promise<DashboardSummary> {
  const [
    operadores,
    enLinea,
    locales,
    rutasHoy,
    rutasPendientes,
    certificados,
    rutasEstado,
    actividad,
  ] = await Promise.all([
    scalar("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'operador' AND activo = 1"),
    scalar(`
      SELECT COUNT(DISTINCT usuario_id) AS n
      FROM ubicaciones
      WHERE estado IN ('activo', 'en_linea')
        AND timestamp >= NOW() - INTERVAL 15 MINUTE
    `),
    scalar("SELECT COUNT(*) AS n FROM locales WHERE COALESCE(activo, 1) = 1"),
    scalar(`
      SELECT COUNT(*) AS n FROM rutas_asignadas
      WHERE DATE(fecha_asignacion) = CURDATE()
    `),
    scalar(`
      SELECT COUNT(*) AS n FROM rutas_asignadas
      WHERE estado IN ('pendiente', 'en_proceso')
    `),
    scalar(`
      SELECT COUNT(*) AS n FROM locales
      WHERE COALESCE(activo, 1) = 1
        AND necesita_certificacion = 1
        AND (estado_certificacion IS NULL OR estado_certificacion = 'pendiente')
    `),
    rows<RowDataPacket & { estado: string; n: number }>(`
      SELECT estado, COUNT(*) AS n
      FROM rutas_asignadas
      WHERE DATE(fecha_asignacion) = CURDATE()
      GROUP BY estado
    `),
    rows<RowDataPacket & { fecha: string; puntos: number }>(`
      SELECT DATE(timestamp) AS fecha, COUNT(*) AS puntos
      FROM ubicaciones
      WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(timestamp)
      ORDER BY fecha ASC
    `),
  ]);

  const byEstado = Object.fromEntries(rutasEstado.map((row) => [row.estado, Number(row.n)]));

  return {
    kpis: {
      operadores,
      enLinea,
      locales,
      rutasHoy,
      rutasPendientes,
      certificados,
    },
    rutasHoy: {
      pendientes: byEstado.pendiente ?? 0,
      enProceso: byEstado.en_proceso ?? 0,
      completadas: byEstado.completada ?? 0,
    },
    actividad: actividad.map((row) => ({
      fecha: String(row.fecha),
      puntos: Number(row.puntos),
    })),
  };
}
