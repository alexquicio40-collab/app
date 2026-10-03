import { enLima } from "@/lib/fecha-lima";

export function horaLima(at: number | null) {
  if (!at) return "—";
  const raw = enLima(new Date(at).toISOString());
  const m = /(\d{2}):(\d{2})/.exec(raw);
  if (!m) return "—";
  const h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export function minsLabel(minutos: number) {
  if (minutos < 1) return "< 1 min";
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function kmLabel(km: number) {
  if (km < 0.1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function velLabel(kmh: number) {
  return `${Math.round(kmh)} km/h`;
}
