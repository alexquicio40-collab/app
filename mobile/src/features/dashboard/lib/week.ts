import type { DashboardSummary } from "../types";

const DAYS = ["D", "L", "M", "X", "J", "V", "S"];

export type WeekPoint = {
  key: string;
  label: string;
  puntos: number;
};

export function buildWeek(actividad: DashboardSummary["actividad"]): WeekPoint[] {
  const map = new Map(
    actividad.map((item) => [String(item.fecha).slice(0, 10), item.puntos]),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    return {
      key,
      label: DAYS[date.getDay()] ?? "D",
      puntos: map.get(key) ?? 0,
    };
  });
}

export function todayLabel() {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}
