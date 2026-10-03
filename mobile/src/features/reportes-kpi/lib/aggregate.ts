import type { PlantaRegistro } from "@/features/planta/types";
import { asEstado, estadoRecojoLabel } from "@/features/routes/lib/estados-recojo";
import type { RouteItem } from "@/features/routes/types";
import { dayKeyFromIso } from "./period";
import type {
  AsignadorAgg,
  AsignadorOption,
  ConductorAgg,
  EnvasesTotales,
  LocalAgg,
  PlantaAsesorAgg,
  PlantaProveedorAgg,
  ReportSnapshot,
  RutaAsignadaItem,
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
    programado: 0,
    enRuta: 0,
    llego: 0,
    recolectado: 0,
    noRecolectado: 0,
    reprogramado: 0,
    cerrado: 0,
  };
  for (const item of rows) {
    const estado = asEstado(item.estado);
    if (estado === "programado") map.programado += 1;
    else if (estado === "en_ruta") map.enRuta += 1;
    else if (estado === "llego") map.llego += 1;
    else if (estado === "recolectado") map.recolectado += 1;
    else if (estado === "no_recolectado") map.noRecolectado += 1;
    else if (estado === "reprogramado") map.reprogramado += 1;
    else if (estado === "cerrado") map.cerrado += 1;
  }
  const total = rows.length;
  const efectivo = total - map.cerrado;
  return {
    total,
    ...map,
    cumplimientoPct: efectivo > 0 ? Math.round((map.recolectado / efectivo) * 1000) / 10 : 0,
  };
}

export function asignadorKey(item: RouteItem): string {
  const id = item.creadoPorId?.trim();
  if (id) return id;
  const nombre = item.creadoPorNombre?.trim();
  return nombre ? `n:${nombre}` : "sin";
}

export function asignadorNombre(item: RouteItem): string {
  const nombre = item.creadoPorNombre?.trim();
  if (nombre) return nombre;
  const id = item.creadoPorId?.trim();
  return id ? `Usuario ${id}` : "Sin asignador";
}

export function uniqueAsignadores(rows: RouteItem[]): AsignadorOption[] {
  const map = new Map<string, AsignadorOption>();
  for (const item of rows) {
    const id = asignadorKey(item);
    if (!map.has(id)) map.set(id, { id, nombre: asignadorNombre(item) });
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function porAsignador(rows: RouteItem[]): AsignadorAgg[] {
  const map = new Map<string, AsignadorAgg>();
  for (const item of rows) {
    const id = asignadorKey(item);
    const prev =
      map.get(id) ??
      ({
        id,
        nombre: asignadorNombre(item),
        asignadas: 0,
        recolectadas: 0,
        litros: 0,
        baldes: 0,
        galoneras: 0,
      } satisfies AsignadorAgg);
    prev.asignadas += 1;
    if (asEstado(item.estado) === "recolectado") {
      prev.recolectadas += 1;
      prev.litros += item.litraje ?? 0;
      prev.baldes += item.baldesVacios ?? 0;
      prev.galoneras += item.galonerasVacias ?? 0;
    }
    map.set(id, prev);
  }
  return [...map.values()].sort((a, b) => b.asignadas - a.asignadas);
}

function rutasAsignadas(rows: RouteItem[]): RutaAsignadaItem[] {
  return rows
    .slice()
    .sort((a, b) => {
      const fa = a.fechaAsignacion || "";
      const fb = b.fechaAsignacion || "";
      if (fa !== fb) return fa.localeCompare(fb);
      return asignadorNombre(a).localeCompare(asignadorNombre(b), "es");
    })
    .map((item) => ({
      id: item.id,
      fecha: (item.fechaAsignacion || "").slice(0, 10),
      asignador: asignadorNombre(item),
      conductor: item.conductorNombre || "Sin operador",
      local: item.localNombre || "Sin local",
      estado: estadoRecojoLabel(item.estado),
      litros: item.litraje ?? 0,
      baldes: item.baldesVacios ?? 0,
      galoneras: item.galonerasVacias ?? 0,
    }));
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
        programado: 0,
        enRuta: 0,
        llego: 0,
        recolectado: 0,
        noRecolectado: 0,
        reprogramado: 0,
        cerrado: 0,
        litros: 0,
        baldes: 0,
        galoneras: 0,
      } satisfies ConductorAgg);
    prev.total += 1;
    prev.litros += item.litraje ?? 0;
    prev.baldes += item.baldesVacios ?? 0;
    prev.galoneras += item.galonerasVacias ?? 0;
    const estado = asEstado(item.estado);
    if (estado === "programado") prev.programado += 1;
    else if (estado === "en_ruta") prev.enRuta += 1;
    else if (estado === "llego") prev.llego += 1;
    else if (estado === "recolectado") prev.recolectado += 1;
    else if (estado === "no_recolectado") prev.noRecolectado += 1;
    else if (estado === "reprogramado") prev.reprogramado += 1;
    else if (estado === "cerrado") prev.cerrado += 1;
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
        recolectado: 0,
        programado: 0,
        cerrado: 0,
      } satisfies LocalAgg);
    prev.total += 1;
    const estado = asEstado(item.estado);
    if (estado === "recolectado") prev.recolectado += 1;
    else if (estado === "programado") prev.programado += 1;
    else if (estado === "cerrado") prev.cerrado += 1;
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
    porAsignador: porAsignador(rutas),
    rutasAsignadas: rutasAsignadas(rutas),
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
