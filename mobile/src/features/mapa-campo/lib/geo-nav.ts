import type { LatLng } from "@/features/routes/navegacion/types";

const R = 6371000;
const METERS_PER_DEG = 111_320;

export function haversineMeters(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

type LocalXY = { x: number; y: number };

function toLocal(origin: LatLng, p: LatLng): LocalXY {
  const cos = Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: ((p.lng - origin.lng) * Math.PI) / 180 * cos * R,
    y: ((p.lat - origin.lat) * Math.PI) / 180 * R,
  };
}

function fromLocal(origin: LatLng, xy: LocalXY): LatLng {
  const cos = Math.cos((origin.lat * Math.PI) / 180);
  return {
    lat: origin.lat + (xy.y / R) * (180 / Math.PI),
    lng: origin.lng + (xy.x / (R * cos)) * (180 / Math.PI),
  };
}

function projectOnSegment(p: LatLng, a: LatLng, b: LatLng) {
  const P = toLocal(a, p);
  const B = toLocal(a, b);
  const len2 = B.x * B.x + B.y * B.y;
  if (len2 < 1e-6) {
    return { point: a, t: 0, dist: haversineMeters(p, a) };
  }
  let t = (P.x * B.x + P.y * B.y) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = fromLocal(a, { x: B.x * t, y: B.y * t });
  return { point, t, dist: haversineMeters(p, point) };
}

function segmentHeading(a: LatLng, b: LatLng) {
  const y =
    Math.sin(((b.lng - a.lng) * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180);
  const x =
    Math.cos((a.lat * Math.PI) / 180) * Math.sin((b.lat * Math.PI) / 180) -
    Math.sin((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.cos(((b.lng - a.lng) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Distancia mínima del punto a la polyline (metros). */
export function distanceToPolylineMeters(point: LatLng, path: LatLng[]) {
  return snapToPolyline(point, path).dist;
}

export type SnapResult = {
  point: LatLng;
  dist: number;
  /** Índice del segmento (a = path[i], b = path[i+1]). */
  segmentIndex: number;
  heading: number;
  remainingMeters: number;
};

/**
 * Proyecta el GPS sobre la ruta (estilo Waze):
 * evita “saltar” fuera de la calle por ruido del sensor.
 */
export function snapToPolyline(point: LatLng, path: LatLng[]): SnapResult {
  if (path.length === 0) {
    return {
      point,
      dist: Number.POSITIVE_INFINITY,
      segmentIndex: 0,
      heading: 0,
      remainingMeters: 0,
    };
  }
  if (path.length === 1) {
    return {
      point: path[0]!,
      dist: haversineMeters(point, path[0]!),
      segmentIndex: 0,
      heading: 0,
      remainingMeters: 0,
    };
  }

  let best = {
    point: path[0]!,
    dist: Number.POSITIVE_INFINITY,
    segmentIndex: 0,
    t: 0,
  };

  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const proj = projectOnSegment(point, a, b);
    if (proj.dist < best.dist) {
      best = {
        point: proj.point,
        dist: proj.dist,
        segmentIndex: i,
        t: proj.t,
      };
    }
  }

  const a = path[best.segmentIndex]!;
  const b = path[best.segmentIndex + 1]!;
  let remaining = haversineMeters(best.point, b);
  for (let i = best.segmentIndex + 1; i < path.length - 1; i += 1) {
    remaining += haversineMeters(path[i]!, path[i + 1]!);
  }

  return {
    point: best.point,
    dist: best.dist,
    segmentIndex: best.segmentIndex,
    heading: segmentHeading(a, b),
    remainingMeters: remaining,
  };
}

/** Tramo ya recorrido: desde el inicio hasta el punto proyectado. */
export function slicePathBehind(path: LatLng[], snap: SnapResult): LatLng[] {
  if (path.length === 0) return [];
  if (path.length === 1) return [path[0]!];
  const out = path.slice(0, snap.segmentIndex + 1);
  const last = out[out.length - 1];
  if (!last || haversineMeters(last, snap.point) > 1.5) {
    out.push(snap.point);
  }
  return out;
}

/** Tramo pendiente: desde el punto proyectado hasta el destino. */
export function slicePathAhead(path: LatLng[], snap: SnapResult): LatLng[] {
  if (path.length === 0) return [];
  const out: LatLng[] = [snap.point];
  for (let i = snap.segmentIndex + 1; i < path.length; i += 1) {
    out.push(path[i]!);
  }
  return out;
}


export function spliceForwardRoute(
  traveled: LatLng[],
  forward: LatLng[],
  junction: LatLng,
): LatLng[] {
  const head = traveled.length ? [...traveled] : [];
  const last = head[head.length - 1];
  if (!last || haversineMeters(last, junction) > 2) {
    head.push(junction);
  }

  let fwd = forward.slice();
  if (fwd[0] && haversineMeters(fwd[0], junction) < 12) {
    fwd = fwd.slice(1);
  }

  const merged = [...head, ...fwd];
  return merged.length >= 2 ? merged : [junction, ...(fwd[0] ? [fwd[0]] : [])];
}

export function pathLengthMeters(path: LatLng[]) {
  let sum = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    sum += haversineMeters(path[i]!, path[i + 1]!);
  }
  return sum;
}

/** Offset perpendicular a la ruta (para simular desvío en web). */
export function offsetPerpendicular(point: LatLng, headingDeg: number, meters: number): LatLng {
  const rad = ((headingDeg + 90) * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / METERS_PER_DEG;
  const dLng =
    (meters * Math.sin(rad)) / (METERS_PER_DEG * Math.cos((point.lat * Math.PI) / 180));
  return { lat: point.lat + dLat, lng: point.lng + dLng };
}

/** @deprecated usar snapToPolyline(...).remainingMeters */
export function remainingPathMeters(point: LatLng, path: LatLng[]) {
  return snapToPolyline(point, path).remainingMeters;
}

/** Avanza `stepMeters` a lo largo de la polyline desde el punto más cercano. */
export function advanceAlongPath(
  point: LatLng,
  path: LatLng[],
  stepMeters: number,
): { point: LatLng; heading: number; remainingMeters: number } {
  const snap = snapToPolyline(point, path);
  if (path.length < 2 || stepMeters <= 0) {
    return {
      point: snap.point,
      heading: snap.heading,
      remainingMeters: snap.remainingMeters,
    };
  }

  let left = stepMeters;
  let cur = snap.point;
  let i = snap.segmentIndex;
  let heading = snap.heading;

  while (left > 0 && i < path.length - 1) {
    const next = path[i + 1]!;
    const seg = haversineMeters(cur, next);
    if (seg <= left) {
      left -= seg;
      cur = next;
      i += 1;
      if (i < path.length - 1) {
        heading = segmentHeading(path[i]!, path[i + 1]!);
      }
    } else {
      const t = left / seg;
      cur = {
        lat: cur.lat + (next.lat - cur.lat) * t,
        lng: cur.lng + (next.lng - cur.lng) * t,
      };
      heading = segmentHeading(cur, next);
      left = 0;
    }
  }

  const remaining = snapToPolyline(cur, path).remainingMeters;
  return { point: cur, heading, remainingMeters: remaining };
}

/** Suaviza saltos GPS absurdos (teleport). */
export function shouldAcceptMove(
  prev: LatLng | null,
  next: LatLng,
  dtMs: number,
  maxSpeedMps = 45,
) {
  if (!prev) return true;
  if (dtMs <= 0) return true;
  const dist = haversineMeters(prev, next);
  const maxDist = maxSpeedMps * (dtMs / 1000) + 25;
  return dist <= maxDist;
}

export const OFF_ROUTE_METERS = 55;
/** Micro-ajuste a la calle: solo ruido GPS, no un salto de cuadra. */
export const SNAP_METERS = 12;
export const RECALC_COOLDOWN_MS = 18_000;
export const ARRIVAL_METERS = 35;
