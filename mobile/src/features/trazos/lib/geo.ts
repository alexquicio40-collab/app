export function metros(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function rumbo(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Expo manda m/s; el web a veces ya guarda km/h. */
export function aKmh(raw: number) {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw <= 45 ? raw * 3.6 : raw;
}

export function colorVel(kmh: number) {
  if (kmh < 6) return "#148A46";
  if (kmh < 20) return "#C9A227";
  if (kmh < 40) return "#E07A1A";
  return "#C62828";
}

export function downsample<T extends { lat: number; lng: number }>(rows: T[], max = 1600) {
  if (rows.length <= max) return rows;
  const keep: T[] = [];
  const step = rows.length / max;
  for (let i = 0; i < rows.length; i += step) {
    keep.push(rows[Math.min(rows.length - 1, Math.round(i))]!);
  }
  if (keep[keep.length - 1] !== rows[rows.length - 1]) keep.push(rows[rows.length - 1]!);
  return keep;
}

export type PuntoClave = { lat: number; lng: number; at?: number };

function asClave<T extends { lat: number; lng: number; at?: number }>(row: T): PuntoClave {
  return { lat: row.lat, lng: row.lng, at: row.at };
}

/** Puntos clave del GPS para pedir la ruta por calle (no línea aérea). */
export function waypointsCalle<T extends { lat: number; lng: number; at?: number }>(
  rows: T[],
): PuntoClave[] {
  if (!rows.length) return [];
  const first = rows[0]!;
  const out: PuntoClave[] = [asClave(first)];
  let last = first;
  let heading = 0;
  for (let i = 1; i < rows.length - 1; i += 1) {
    const cur = rows[i]!;
    const d = metros(last, cur);
    if (d < 80) continue;
    const nextH = rumbo(last, cur);
    const giro = Math.abs(((nextH - heading + 540) % 360) - 180);
    if (d >= 350 || d > 2000 || giro >= 36) {
      out.push(asClave(cur));
      last = cur;
      heading = nextH;
    }
  }
  const end = rows[rows.length - 1]!;
  if (metros(out[out.length - 1]!, end) > 25) out.push(asClave(end));
  return out;
}
