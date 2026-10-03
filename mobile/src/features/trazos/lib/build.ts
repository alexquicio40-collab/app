import { asEstado } from "@/features/routes/lib/estados-recojo";
import type { RouteItem } from "@/features/routes/types";
import type { GpsPunto, TrazoDia, TrazoLocal, TrazoParada, TrazoSegmento } from "../types";
import { colorVel, downsample, metros, waypointsCalle } from "./geo";

const STOP_KMH = 5.5;
const STOP_MOVE_M = 32;
const STOP_MIN_MS = 90_000;
const LOCAL_M = 90;

export function armarTrazo(input: {
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  puntos: GpsPunto[];
  rutas: RouteItem[];
}): TrazoDia {
  const raw = input.puntos.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const puntos = downsample(raw, 1600);
  const segmentos = armarSegmentos(puntos);
  const paradas = detectarParadas(raw);
  const locales = emparejarLocales(input.rutas, raw, paradas);
  const conLocal = paradas.map((item) => {
    const near = locales.find((local) => metros(item, local) <= LOCAL_M);
    return near
      ? { ...item, localId: near.id, localNombre: near.nombre }
      : item;
  });

  const inicio = raw[0]?.at ?? null;
  const fin = raw[raw.length - 1]?.at ?? null;
  const km = distanciaKm(raw);
  const duracionMin = inicio && fin ? (fin - inicio) / 60000 : 0;
  const paradoMin = conLocal.reduce((sum, item) => sum + item.minutos, 0);
  const velMax = raw.reduce((max, item) => Math.max(max, item.kmh), 0);
  const velProm = raw.length
    ? raw.reduce((sum, item) => sum + item.kmh, 0) / raw.length
    : 0;

  return {
    usuarioId: input.usuarioId,
    usuarioNombre: input.usuarioNombre,
    fecha: input.fecha,
    inicio,
    fin,
    puntos,
    waypoints: armarWaypoints(raw, locales),
    segmentos,
    paradas: conLocal,
    locales,
    kpis: {
      puntos: raw.length,
      km,
      duracionMin,
      paradoMin,
      moviendoMin: Math.max(0, duracionMin - paradoMin),
      velMax,
      velProm,
      paradas: conLocal.length,
      locales: locales.length,
      visitados: locales.filter((item) => item.llego != null).length,
    },
  };
}

function armarSegmentos(puntos: GpsPunto[]): TrazoSegmento[] {
  const out: TrazoSegmento[] = [];
  for (let i = 1; i < puntos.length; i += 1) {
    const a = puntos[i - 1]!;
    const b = puntos[i]!;
    if (metros(a, b) > 4000) continue;
    const kmh = Math.max(a.kmh, b.kmh);
    out.push({ a: { lat: a.lat, lng: a.lng }, b: { lat: b.lat, lng: b.lng }, kmh, color: colorVel(kmh) });
  }
  return out;
}

function detectarParadas(puntos: GpsPunto[]): TrazoParada[] {
  const out: TrazoParada[] = [];
  let i = 0;
  while (i < puntos.length) {
    const seed = puntos[i]!;
    let j = i + 1;
    let lat = seed.lat;
    let lng = seed.lng;
    let n = 1;
    while (j < puntos.length) {
      const next = puntos[j]!;
      const quieto = next.kmh <= STOP_KMH && metros(seed, next) <= STOP_MOVE_M;
      if (!quieto) break;
      lat += next.lat;
      lng += next.lng;
      n += 1;
      j += 1;
    }
    const last = puntos[j - 1]!;
    const ms = last.at - seed.at;
    if (ms >= STOP_MIN_MS) {
      out.push({
        id: `p-${seed.at}`,
        lat: lat / n,
        lng: lng / n,
        desde: seed.at,
        hasta: last.at,
        minutos: ms / 60000,
        localId: null,
        localNombre: null,
      });
    }
    i = Math.max(j, i + 1);
  }
  return out;
}

function emparejarLocales(
  rutas: RouteItem[],
  puntos: GpsPunto[],
  paradas: TrazoParada[],
): TrazoLocal[] {
  return rutas
    .filter((item) => item.localLatitud != null && item.localLongitud != null)
    .slice()
    .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
    .map((ruta, index) => {
      const pin = { lat: ruta.localLatitud!, lng: ruta.localLongitud! };
      const near = puntos.filter((item) => metros(item, pin) <= LOCAL_M);
      const llego = near[0]?.at ?? null;
      const salio = near[near.length - 1]?.at ?? null;
      const stop = paradas.find((item) => metros(item, pin) <= LOCAL_M);
      const minutos =
        llego && salio ? (salio - llego) / 60000 : stop?.minutos ?? 0;
      return {
        id: ruta.localId || ruta.id,
        rutaId: ruta.id,
        nombre: ruta.localNombre || "Local",
        lat: pin.lat,
        lng: pin.lng,
        orden: ruta.orden ?? index + 1,
        estado: asEstado(ruta.estado),
        llego,
        salio,
        minutos,
      };
    });
}

function armarWaypoints(puntos: GpsPunto[], locales: TrazoLocal[]) {
  if (!puntos.length) return [];
  const sampled = waypointsCalle(puntos);
  const visits = locales
    .filter((item) => item.llego != null)
    .sort((a, b) => (a.llego ?? 0) - (b.llego ?? 0));
  if (!visits.length) return sampled;

  const out = sampled.slice();
  for (const local of visits) {
    const pin = { lat: local.lat, lng: local.lng, at: local.llego ?? undefined };
    if (out.some((item) => metros(item, pin) <= 90)) continue;
    let insertAt = out.length - 1;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < out.length; i += 1) {
      const t = out[i]!.at ?? 0;
      const dt = Math.abs(t - (local.llego ?? 0));
      if (dt < best) {
        best = dt;
        insertAt = i + 1;
      }
    }
    out.splice(insertAt, 0, pin);
  }
  return out;
}

function distanciaKm(puntos: GpsPunto[]) {
  let m = 0;
  for (let i = 1; i < puntos.length; i += 1) {
    const jump = metros(puntos[i - 1]!, puntos[i]!);
    if (jump < 1800) m += jump;
  }
  return m / 1000;
}
