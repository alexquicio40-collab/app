import { RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

export type LiveOperator = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  estado: "activo" | "en_linea";
};

export type LiveStop = {
  id: number;
  operatorId: number;
  operatorName: string;
  localName: string;
  latitude: number;
  longitude: number;
  estado: string;
};

export type MapLive = {
  operators: LiveOperator[];
  stops: LiveStop[];
};

async function queryRows<T extends RowDataPacket>(sql: string) {
  try {
    const [rows] = await pool.query<T[]>(sql);
    return rows;
  } catch {
    return [] as T[];
  }
}

export async function getLiveMap(): Promise<MapLive> {
  const [operators, stops] = await Promise.all([
    queryRows<RowDataPacket>(`
      SELECT
        u.id AS usuario_id,
        u.nombre,
        loc.latitude,
        loc.longitude,
        loc.velocidad,
        loc.timestamp,
        loc.estado
      FROM usuarios u
      INNER JOIN ubicaciones loc ON loc.usuario_id = u.id
      WHERE u.rol = 'operador'
        AND u.activo = 1
        AND loc.estado IN ('activo', 'en_linea')
        AND loc.timestamp >= NOW() - INTERVAL 15 MINUTE
        AND loc.id = (
          SELECT id FROM ubicaciones
          WHERE usuario_id = u.id
            AND estado IN ('activo', 'en_linea')
          ORDER BY timestamp DESC
          LIMIT 1
        )
      ORDER BY u.nombre
    `),
    queryRows<RowDataPacket>(`
      SELECT
        r.id,
        r.conductor_id,
        u.nombre AS operator_name,
        l.nombre AS local_nombre,
        l.latitud,
        l.longitud,
        r.estado
      FROM rutas_asignadas r
      INNER JOIN usuarios u ON u.id = r.conductor_id
      INNER JOIN locales l ON l.id = r.local_id
      WHERE DATE(r.fecha_asignacion) = CURDATE()
        AND r.estado IN ('programado', 'en_ruta', 'llego', 'pendiente', 'en_proceso')
        AND l.latitud IS NOT NULL
        AND l.longitud IS NOT NULL
    `),
  ]);

  return {
    operators: operators
      .map((row) => ({
        id: Number(row.usuario_id),
        name: String(row.nombre ?? "Operador"),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        speed: Number(row.velocidad ?? 0),
        timestamp: new Date(row.timestamp).toISOString(),
        estado: row.estado === "activo" ? "activo" : "en_linea",
      }))
      .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)),
    stops: stops
      .map((row) => ({
        id: Number(row.id),
        operatorId: Number(row.conductor_id),
        operatorName: String(row.operator_name ?? "Operador"),
        localName: String(row.local_nombre ?? "Local"),
        latitude: Number(row.latitud),
        longitude: Number(row.longitud),
        estado: String(row.estado ?? "pendiente"),
      }))
      .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)),
  };
}
