import { dia, hoy, sumarDias } from "@/lib/fecha-lima";
import type { BitacoraEvento, BitacoraGrupo, BitacoraPeriodo } from "../types";

export function rangoPeriodo(periodo: BitacoraPeriodo) {
  const hasta = hoy();
  if (periodo === "hoy") return { desde: hasta, hasta };
  if (periodo === "semana") return { desde: sumarDias(hasta, -6), hasta };
  if (periodo === "mes") return { desde: sumarDias(hasta, -29), hasta };
  return { desde: "2020-01-01", hasta };
}

export function horaCorta(value?: string | null) {
  if (!value) return "—";
  const raw = String(value).replace("T", " ");
  const match = /(\d{2}:\d{2})/.exec(raw);
  return match ? match[1] : raw.slice(0, 16);
}

export function diaTitulo(value: string) {
  const key = dia(value);
  if (key === hoy()) return "Hoy";
  if (key === sumarDias(hoy(), -1)) return "Ayer";
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

export function agruparPorDia(items: BitacoraEvento[]): BitacoraGrupo[] {
  const map = new Map<string, BitacoraEvento[]>();
  for (const item of items) {
    const key = dia(item.cuando);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()].map(([key, rows]) => ({ dia: key, items: rows }));
}

export function pathToModulo(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  const mapa: Record<string, string> = {
    "/": "inicio",
    "/index": "inicio",
    "/modulos": "modulos",
    "/rutas": "rutas",
    "/locales": "locales",
    "/usuarios": "usuarios",
    "/sesiones": "sesiones",
    "/operadores": "operadores",
    "/mapa": "mapa",
    "/rutas-mapa": "rutas_mapa",
    "/planta": "planta",
    "/certificados": "certificados",
    "/pagos": "pagos",
    "/hoja-ruta": "hoja_ruta",
    "/reportes-kpi": "estadisticas",
    "/reportes": "reportes",
    "/conductores": "operadores",
  };
  return mapa[path] || null;
}
