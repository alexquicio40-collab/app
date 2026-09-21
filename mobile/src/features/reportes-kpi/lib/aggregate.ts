import type { PlantaRegistro } from "@/features/planta/types";
import type { RouteItem } from "@/features/routes/types";
import { dayKeyFromIso } from "./period";
import type {
  ConductorAgg,
  EnvasesTotales,
  LocalAgg,
  PlantaAsesorAgg,
  PlantaProveedorAgg,
  ReportSnapshot,
  RutasConteo,
} from "../types";

function emptyEnvases(): EnvasesTotales {
  return { litros: 0, baldes: 0, galoneras: 0 };
}

function sumEnvasesRutas(rows: RouteItem[]): EnvasesTotales {
  return rows.reduce((acc, item) => {
    acc.litros += item.litraje ?? 0;
    acc.baldes += item.baldesVacios ?? 0;
    acc.galoneras += item.galonerasVacias ?? 0;
    return acc;
  }, emptyEnvases());
}

function sumEnvasesPlanta(rows: PlantaRegistro[]): EnvasesTotales {
  return rows.reduce((acc, item) => {
    acc.litros += item.cantidadLitraje;
    acc.baldes += item.cantidadBaldesVacios;
    acc.galoneras += item.cantidadGalonerasVacias;
    return acc;
  }, emptyEnvases());
}

function mergeEnvases(a: EnvasesTotales, b: EnvasesTotales): EnvasesTotales {
  return {
    litros: a.litros + b.litros,
    baldes: a.baldes + b.baldes,
    galoneras: a.galoneras + b.galoneras,
  };
}

export function filterPlantaByPeriod(
  rows: PlantaRegistro[],
  fechaDesde: string,
  fechaHasta: string,
) {
  return rows.filter((item) => {
    const day = dayKeyFromIso(item.ingresoMercaderia);
    if (!day) return false;
    return day >= fechaDesde && day <= fechaHasta;
  });
}

function conteoRutas(rows: RouteItem[]): RutasConteo {
  const map = {
    pendiente: 0,
    en_proceso: 0,
    en_ruta: 0,
    completada: 0,
    cancelada: 0,
  };
  for (const item of rows) {
    const estado = String(item.estado || "").toLowerCase();
    if (estado in map) map[estado as keyof typeof map] += 1;
  }
  const total = rows.length;
  const efectivo = total - map.cancelada;
  return {
    total,
    pendiente: map.pendiente,
    enProceso: map.en_proceso,
    enRuta: map.en_ruta,
    completada: map.completada,
    cancelada: map.cancelada,
    cumplimientoPct: efectivo > 0 ? Math.round((map.completada / efectivo) * 1000) / 10 : 0,
  };
}

function porConductor(rows: RouteItem[]): ConductorAgg[] {
  const map = new Map<string, ConductorAgg>();
  for (const item of rows) {
    const id = item.conductorId || "sin";
    const prev =
      map.get(id) ??
      ({
        id,
        nombre: item.conductorNombre || "Sin conductor",
        total: 0,
        pendiente: 0,
        enProceso: 0,
        enRuta: 0,
        completada: 0,
        cancelada: 0,
        litros: 0,
        baldes: 0,
        galoneras: 0,
      } satisfies ConductorAgg);
    prev.total += 1;
    prev.litros += item.litraje ?? 0;
    prev.baldes += item.baldesVacios ?? 0;
    prev.galoneras += item.galonerasVacias ?? 0;
    const estado = String(item.estado || "").toLowerCase();
    if (estado === "pendiente") prev.pendiente += 1;
    else if (estado === "en_proceso") prev.enProceso += 1;
    else if (estado === "en_ruta") prev.enRuta += 1;
    else if (estado === "completada") prev.completada += 1;
    else if (estado === "cancelada") prev.cancelada += 1;
    map.set(id, prev);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function porLocal(rows: RouteItem[]): LocalAgg[] {
  const map = new Map<string, LocalAgg>();
  for (const item of rows) {
    const id = item.localId || item.localNombre || "sin";
    const prev =
      map.get(id) ??
      ({
        id,
        nombre: item.localNombre || "Sin local",
        total: 0,
        completada: 0,
        pendiente: 0,
        cancelada: 0,
      } satisfies LocalAgg);
    prev.total += 1;
    const estado = String(item.estado || "").toLowerCase();
    if (estado === "completada") prev.completada += 1;
    else if (estado === "pendiente") prev.pendiente += 1;
    else if (estado === "cancelada") prev.cancelada += 1;
    map.set(id, prev);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 20);
}

function plantaPorAsesor(rows: PlantaRegistro[]): PlantaAsesorAgg[] {
  const map = new Map<string, PlantaAsesorAgg>();
  for (const item of rows) {
    const nombre = item.asesorComercial.trim() || "Sin asesor";
    const prev =
      map.get(nombre) ??
      ({ nombre, total: 0, litros: 0, baldes: 0, galoneras: 0 } satisfies PlantaAsesorAgg);
    prev.total += 1;
    prev.litros += item.cantidadLitraje;
    prev.baldes += item.cantidadBaldesVacios;
    prev.galoneras += item.cantidadGalonerasVacias;
    map.set(nombre, prev);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function plantaPorProveedor(rows: PlantaRegistro[]): PlantaProveedorAgg[] {
  const map = new Map<string, PlantaProveedorAgg>();
  for (const item of rows) {
    const nombre = item.nombreProveedor.trim() || "Sin proveedor";
    const prev =
      map.get(nombre) ??
      ({ nombre, total: 0, litros: 0, baldes: 0, galoneras: 0 } satisfies PlantaProveedorAgg);
    prev.total += 1;
    prev.litros += item.cantidadLitraje;
    prev.baldes += item.cantidadBaldesVacios;
    prev.galoneras += item.cantidadGalonerasVacias;
    map.set(nombre, prev);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
}

export function buildReportSnapshot(
  rutas: RouteItem[],
  planta: PlantaRegistro[],
  plantaTotalSinFiltro: number,
): ReportSnapshot {
  const envasesRutas = sumEnvasesRutas(rutas);
  const envasesPlanta = sumEnvasesPlanta(planta);
  return {
    envasesRutas,
    envasesPlanta,
    envasesTotal: mergeEnvases(envasesRutas, envasesPlanta),
    rutas: conteoRutas(rutas),
    porConductor: porConductor(rutas),
    porLocal: porLocal(rutas),
    plantaPorAsesor: plantaPorAsesor(planta),
    plantaPorProveedor: plantaPorProveedor(planta),
    plantaDetalle: planta.map((item) => ({
      id: item.id,
      ingreso: item.ingresoMercaderia,
      proveedor: item.nombreProveedor,
      asesor: item.asesorComercial,
      guia: item.guiaRetiro,
      litros: item.cantidadLitraje,
      baldes: item.cantidadBaldesVacios,
      galoneras: item.cantidadGalonerasVacias,
      notas: item.notas,
    })),
    plantaTotalSinFiltro,
  };
}
