import { isEnCurso, isNoRecolectado, isRecolectado } from "@/features/routes/lib/estados-recojo";
import type { RouteItem } from "@/features/routes/types";
import { dia, sumarDias } from "@/lib/fecha-lima";
import type { AdminDash, DeltaAdmin, PeriodoAdmin } from "../types";

export type RangoPersonalizado = { desde: string; hasta: string };

export type FuenteGerencia = {
  hoy: string;
  rutas: RouteItem[];
  certificados: string[] | null;
  metaMensual: number | null;
  coberturaDesde: string;
  coberturaHasta: string;
};

const VS: Record<PeriodoAdmin, string> = {
  hoy: "vs. ayer",
  semana: "vs. semana pasada",
  mes: "vs. mes pasado",
  personalizado: "vs. periodo anterior",
};

export function buildAdminDash(
  fuente: FuenteGerencia,
  periodo: PeriodoAdmin,
  personalizado?: RangoPersonalizado,
): AdminDash {
  const rango = rangoDe(fuente.hoy, periodo, personalizado);
  const comparable = rango.previoDesde >= fuente.coberturaDesde;
  const actual = fuente.rutas.filter((item) => enRango(dia(item.fechaAsignacion), rango.desde, rango.hasta));
  const previo = fuente.rutas.filter((item) => enRango(dia(item.fechaAsignacion), rango.previoDesde, rango.previoHasta));
  const mes = fuente.rutas.filter((item) => dia(item.fechaAsignacion).startsWith(fuente.hoy.slice(0, 7)));

  const litros = sumaLitros(actual);
  const litrosPrevios = sumaLitros(previo);
  const compras = sumaCompras(actual);
  const comprasPrevias = sumaCompras(previo);
  const camiones = camionesDe(actual);
  const camionesPrevios = new Set(previo.map((item) => item.conductorId || item.conductorNombre)).size;
  const estado = estadoDe(actual);
  const incidencias = actual.filter((item) => isNoRecolectado(item.estado));
  const incidenciasPrevias = previo.filter((item) => isNoRecolectado(item.estado)).length;
  const certificados = contarCertificados(fuente.certificados, rango.desde, rango.hasta);
  const certificadosPrevios = contarCertificados(fuente.certificados, rango.previoDesde, rango.previoHasta);
  const localesMes = new Set(mes.map((item) => item.localId || item.localNombre));
  const localesPrevios = new Set(previo.map((item) => item.localId || item.localNombre));
  const localesActuales = new Set(actual.map((item) => item.localId || item.localNombre));
  const vs = VS[periodo];

  return {
    fecha: fuente.hoy,
    periodo,
    litros,
    deltaLitros: comparable ? delta(litros, litrosPrevios, vs) : null,
    localesAtendidos: estado.atendidos,
    localesPeriodo: estado.total,
    cobertura: estado.total > 0 ? Math.round((estado.atendidos / estado.total) * 100) : 0,
    camionesActivos: camiones.length,
    camionesEnRuta: camiones.filter((item) => item.enRuta).length,
    deltaCamiones: comparable ? delta(camiones.length, camionesPrevios, vs) : null,
    compras,
    deltaCompras: comparable ? delta(compras, comprasPrevias, vs) : null,
    volumenMes: sumaLitros(mes),
    metaMensual: fuente.metaMensual,
    certificados,
    deltaCertificados:
      comparable && certificados != null && certificadosPrevios != null
        ? delta(certificados, certificadosPrevios, vs)
        : null,
    localesEnMes: localesMes.size,
    localesNuevos: [...localesActuales].filter((id) => !localesPrevios.has(id)).length,
    incidencias: incidencias.length,
    incidenciasAltas: incidencias.filter((item) => item.prioridad === "alta").length,
    deltaIncidencias: comparable ? delta(incidencias.length, incidenciasPrevias, vs) : null,
    estado,
    camiones,
    movimientos: movimientosDe(actual),
    topLocales: topLocalesDe(actual),
    alertas: alertasDe(actual),
  };
}

function rangoDe(hoyIso: string, periodo: PeriodoAdmin, personalizado?: RangoPersonalizado) {
  if (periodo === "personalizado" && personalizado) {
    const desde = personalizado.desde <= personalizado.hasta ? personalizado.desde : personalizado.hasta;
    const hasta = personalizado.desde <= personalizado.hasta ? personalizado.hasta : personalizado.desde;
    const dias = diasEntre(desde, hasta);
    const previoHasta = sumarDias(desde, -1);
    return { desde, hasta, previoDesde: sumarDias(previoHasta, -(dias - 1)), previoHasta };
  }
  if (periodo === "hoy") {
    const ayer = sumarDias(hoyIso, -1);
    return { desde: hoyIso, hasta: hoyIso, previoDesde: ayer, previoHasta: ayer };
  }
  if (periodo === "semana") {
    const lunes = lunesDe(hoyIso);
    return {
      desde: lunes,
      hasta: sumarDias(lunes, 6),
      previoDesde: sumarDias(lunes, -7),
      previoHasta: sumarDias(lunes, -1),
    };
  }
  const inicio = `${hoyIso.slice(0, 8)}01`;
  const [year, month] = hoyIso.split("-").map(Number);
  const finDia = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const fin = `${hoyIso.slice(0, 8)}${String(finDia).padStart(2, "0")}`;
  const previo = new Date(Date.UTC(year, month - 2, 1));
  const previoAnio = previo.getUTCFullYear();
  const previoMes = String(previo.getUTCMonth() + 1).padStart(2, "0");
  const finPrevio = String(new Date(Date.UTC(previoAnio, previo.getUTCMonth() + 1, 0)).getUTCDate()).padStart(2, "0");
  return {
    desde: inicio,
    hasta: fin,
    previoDesde: `${previoAnio}-${previoMes}-01`,
    previoHasta: `${previoAnio}-${previoMes}-${finPrevio}`,
  };
}

function lunesDe(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return sumarDias(iso, -((weekday + 6) % 7));
}

function enRango(fecha: string, desde: string, hasta: string) {
  return fecha >= desde && fecha <= hasta;
}

function litrosDe(route: RouteItem) {
  return isRecolectado(route.estado) ? Math.max(0, route.litraje ?? 0) : 0;
}

function sumaLitros(routes: RouteItem[]) {
  return routes.reduce((sum, item) => sum + litrosDe(item), 0);
}

function sumaCompras(routes: RouteItem[]) {
  return routes.reduce((sum, item) => {
    const litros = litrosDe(item);
    const precio = item.precioLitro ?? 0;
    return litros > 0 && precio > 0 ? sum + litros * precio : sum;
  }, 0);
}

function estadoDe(routes: RouteItem[]) {
  const operativas = routes.filter((item) => item.estado !== "cerrado");
  const atendidos = operativas.filter((item) => isRecolectado(item.estado)).length;
  const noAtendidos = operativas.filter((item) => isNoRecolectado(item.estado)).length;
  const reprogramados = operativas.filter((item) => item.estado === "reprogramado").length;
  const pendientes = operativas.length - atendidos - noAtendidos - reprogramados;
  return {
    total: operativas.length,
    atendidos,
    pendientes: Math.max(0, pendientes),
    noAtendidos,
    reprogramados,
  };
}

function camionesDe(routes: RouteItem[]) {
  const map = new Map<string, { id: string; nombre: string; litros: number; total: number; hechos: number; enRuta: boolean }>();
  for (const route of routes) {
    if (route.estado === "cerrado") continue;
    const id = route.conductorId || route.conductorNombre;
    const item = map.get(id) ?? {
      id,
      nombre: route.conductorNombre || "Camión",
      litros: 0,
      total: 0,
      hechos: 0,
      enRuta: false,
    };
    item.total += 1;
    item.litros += litrosDe(route);
    if (isRecolectado(route.estado)) item.hechos += 1;
    if (isEnCurso(route.estado)) item.enRuta = true;
    map.set(id, item);
  }
  return [...map.values()]
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      litros: item.litros,
      avance: item.total > 0 ? Math.round((item.hechos / item.total) * 100) : 0,
      enRuta: item.enRuta,
    }))
    .sort((a, b) => b.litros - a.litros);
}

function movimientosDe(routes: RouteItem[]) {
  return routes
    .filter((item) => isRecolectado(item.estado) || isNoRecolectado(item.estado) || isEnCurso(item.estado))
    .sort((a, b) => marca(b) - marca(a))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      titulo: tituloDe(item),
      detalle: item.localNombre || "Local",
      hora: horaDe(item.fechaCompletada || item.fechaAsignacion),
      litros: isRecolectado(item.estado) ? litrosDe(item) : null,
      icono: iconoDe(item),
    }));
}

function topLocalesDe(routes: RouteItem[]) {
  const map = new Map<string, { id: string; nombre: string; litros: number }>();
  for (const route of routes) {
    const litros = litrosDe(route);
    if (litros <= 0) continue;
    const id = route.localId || route.localNombre;
    const item = map.get(id) ?? { id, nombre: route.localNombre || "Local", litros: 0 };
    item.litros += litros;
    map.set(id, item);
  }
  return [...map.values()].sort((a, b) => b.litros - a.litros).slice(0, 5);
}

function alertasDe(routes: RouteItem[]) {
  const alertas = [];
  for (const route of routes) {
    if (isNoRecolectado(route.estado)) {
      alertas.push({
        id: `no-${route.id}`,
        tono: "peligro" as const,
        titulo: `${route.localNombre || "Local"} sin recojo`,
        detalle: route.localDireccion || route.conductorNombre || "No recolectado",
        hora: horaDe(route.fechaCompletada || route.fechaAsignacion),
      });
      continue;
    }
    if (route.estado === "reprogramado") {
      alertas.push({
        id: `re-${route.id}`,
        tono: "aviso" as const,
        titulo: `${route.localNombre || "Local"} reprogramado`,
        detalle: route.conductorNombre || "Sin camión",
        hora: horaDe(route.fechaAsignacion),
      });
      continue;
    }
    if (route.prioridad === "alta" && !isRecolectado(route.estado)) {
      alertas.push({
        id: `alta-${route.id}`,
        tono: "info" as const,
        titulo: `${route.localNombre || "Local"} prioridad alta`,
        detalle: route.conductorNombre || "Pendiente",
        hora: horaDe(route.fechaAsignacion),
      });
    }
  }
  return alertas.slice(0, 4);
}

function iconoDe(route: RouteItem): "drop" | "pin" | "truck" | "warn" {
  if (isRecolectado(route.estado)) return "drop";
  if (isNoRecolectado(route.estado)) return "warn";
  if (route.estado === "llego") return "pin";
  return "truck";
}

function tituloDe(route: RouteItem) {
  const quien = route.conductorNombre || "Camión";
  if (isRecolectado(route.estado)) return `${quien} registró recojo`;
  if (isNoRecolectado(route.estado)) return `${quien} no recolectó`;
  if (route.estado === "llego") return `${quien} llegó a local`;
  return `${quien} en ruta`;
}

function marca(route: RouteItem) {
  const raw = route.fechaCompletada || route.fechaAsignacion;
  const time = Date.parse(raw.includes("T") ? raw : raw.replace(" ", "T"));
  return Number.isFinite(time) ? time : 0;
}

function horaDe(valor: string) {
  const match = /(\d{2}):(\d{2})/.exec(valor);
  return match ? `${match[1]}:${match[2]}` : "—";
}

function contarCertificados(fechas: string[] | null, desde: string, hasta: string) {
  if (fechas == null) return null;
  return fechas.filter((item) => enRango(dia(item), desde, hasta)).length;
}

export function acotarRango(desde: string, hasta: string): RangoPersonalizado {
  const a = desde <= hasta ? desde : hasta;
  const b = desde <= hasta ? hasta : desde;
  if (diasEntre(a, b) > 31) return { desde: a, hasta: sumarDias(a, 30) };
  return { desde: a, hasta: b };
}

function diasEntre(desde: string, hasta: string) {
  const [y1, m1, d1] = desde.split("-").map(Number);
  const [y2, m2, d2] = hasta.split("-").map(Number);
  const ms = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

function delta(actual: number, previo: number, vs: string): DeltaAdmin | null {
  if (previo <= 0) return null;
  const pct = Math.round(((actual - previo) / previo) * 100);
  if (pct === 0) return null;
  const signo = pct > 0 ? "+" : "";
  return { texto: `${signo}${pct}% ${vs}`, sube: pct > 0 };
}
