import { routeRecogeHint } from "@/features/mapa-campo/lib/route-hints";
import {
  estadoRecojoLabel,
  isCerrado,
  isEnCurso,
  isRecolectado,
} from "@/features/routes/lib/estados-recojo";
import type { RouteItem } from "@/features/routes/types";
import { fechaCabecera, horaCorta, inicialNombre, litros } from "./format";
import type { AvisoRuta, InicioEstado, OperadorInicio, SiguienteLocal } from "../types";

type BuildInput = {
  rutas: RouteItem[];
  placa: string;
  gastos: number;
  gpsActivo: boolean;
  gpsFondo?: boolean;
  ahora?: Date;
};

export function buildOperadorInicio(input: BuildInput): OperadorInicio {
  const ahora = input.ahora ?? new Date();
  const rutas = [...input.rutas].sort(porOrden);
  const locales = rutas.length;
  const atendidos = rutas.filter((item) => isRecolectado(item.estado)).length;
  const litrosHoy = rutas.reduce((sum, item) => sum + (isRecolectado(item.estado) ? item.litraje ?? 0 : 0), 0);
  const avance = locales > 0 ? Math.round((atendidos / locales) * 100) : 0;
  const estado = estadoDe(rutas);
  const siguiente = siguienteDe(rutas);
  const placa = input.placa.trim().toUpperCase();

  return {
    fecha: fechaCabecera(ahora),
    actualizado: horaCorta(ahora),
    titulo: codigoRuta(rutas),
    estado,
    estadoLabel: etiquetaEstado(estado),
    locales,
    litros: litrosHoy,
    atendidos,
    avance,
    placa,
    cargaTexto: textoCarga(litrosHoy, atendidos, locales),
    siguiente,
    tiempo: tiempoEnRuta(rutas),
    gastos: Math.max(0, input.gastos),
    gpsActivo: input.gpsActivo,
    ...textoGps(input.gpsActivo, estado, Boolean(input.gpsFondo)),
    ...accionDe(estado, siguiente),
    avisos: avisosDe(rutas),
  };
}

/** Código de la parada que le toca ahora: la que está en curso, o la siguiente abierta. */
function codigoRuta(rutas: RouteItem[]) {
  if (!rutas.length) return "SIN RUTA";
  const abiertas = rutas.filter((item) => !isRecolectado(item.estado) && !isCerrado(item.estado));
  const actual = abiertas.find((item) => isEnCurso(item.estado)) ?? abiertas[0] ?? rutas[0];
  const id = String(actual?.id ?? "").trim();
  if (!id) return "SIN RUTA";
  const numero = Number(id);
  if (Number.isFinite(numero) && numero >= 0) return `RUTA ${String(numero).padStart(3, "0")}`;
  return `RUTA ${id}`;
}

function porOrden(a: RouteItem, b: RouteItem) {
  const oa = a.orden ?? 9999;
  const ob = b.orden ?? 9999;
  if (oa !== ob) return oa - ob;
  return a.localNombre.localeCompare(b.localNombre, "es");
}

function estadoDe(rutas: RouteItem[]): InicioEstado {
  if (!rutas.length) return "sin_ruta";
  if (rutas.every((item) => isRecolectado(item.estado) || isCerrado(item.estado))) return "completada";
  if (rutas.some((item) => isEnCurso(item.estado))) return "en_progreso";
  return "programada";
}

function etiquetaEstado(estado: InicioEstado) {
  if (estado === "en_progreso") return "EN PROGRESO";
  if (estado === "completada") return "COMPLETADA";
  if (estado === "programada") return "PROGRAMADA";
  return "SIN RUTA";
}

function siguienteDe(rutas: RouteItem[]): SiguienteLocal | null {
  const abiertas = rutas.filter((item) => !isRecolectado(item.estado) && !isCerrado(item.estado));
  const next = abiertas.find((item) => isEnCurso(item.estado)) ?? abiertas[0];
  if (!next) return null;
  const index = rutas.findIndex((item) => item.id === next.id);
  return {
    rutaId: next.id,
    posicion: index + 1,
    total: rutas.length,
    nombre: next.localNombre,
    direccion: next.localDireccion || "Sin dirección",
    horario: next.horarioEntrada ? `Horario: ${next.horarioEntrada}` : "Horario no registrado",
    extra: extraDe(next),
    inicial: inicialNombre(next.localNombre),
  };
}

function extraDe(route: RouteItem) {
  if ((route.litraje ?? 0) > 0 && isRecolectado(route.estado)) {
    return `Recolectado: ${litros(route.litraje ?? 0)}`;
  }
  return routeRecogeHint(route) ?? "Sin envases registrados";
}

function textoCarga(recolectados: number, atendidos: number, total: number) {
  if (recolectados > 0) return `${litros(recolectados)} recolectados`;
  if (total > 0) return `${atendidos} / ${total} locales`;
  return "Sin locales hoy";
}

function tiempoEnRuta(rutas: RouteItem[]) {
  const times = rutas
    .map((item) => item.fechaCompletada)
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value.includes("T") ? value : value.replace(" ", "T")))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (times.length < 2) return "—";
  const minutes = Math.max(0, Math.round((times[times.length - 1] - times[0]) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest} min`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

function textoGps(activo: boolean, estado: InicioEstado, fondo: boolean) {
  if (!activo) {
    return {
      gpsTitulo: "GPS inactivo",
      gpsDetalle: "Activa la ubicación para navegar entre locales.",
    };
  }
  if (fondo) {
    return {
      gpsTitulo: "GPS en segundo plano",
      gpsDetalle: "Sigue enviando tu ubicación con la app cerrada.",
    };
  }
  if (estado === "en_progreso") {
    return {
      gpsTitulo: "GPS activo",
      gpsDetalle: "Tu ubicación se comparte mientras continúas la ruta.",
    };
  }
  return {
    gpsTitulo: "GPS activo",
    gpsDetalle: "Listo para compartir tu ubicación al iniciar la ruta.",
  };
}

function accionDe(estado: InicioEstado, siguiente: SiguienteLocal | null) {
  if (estado === "sin_ruta") {
    return {
      accion: "ninguna" as const,
      accionTitulo: "SIN RUTA HOY",
      accionDetalle: "Cuando te asignen locales, aparecen aquí.",
    };
  }
  if (estado === "completada") {
    return {
      accion: "caja" as const,
      accionTitulo: "RUTA COMPLETA",
      accionDetalle: "Revisa la caja y los gastos del día.",
    };
  }
  const nombre = siguiente?.nombre;
  if (estado === "en_progreso") {
    return {
      accion: "mapa" as const,
      accionTitulo: "CONTINUAR RUTA",
      accionDetalle: nombre ? `Siguiente local: ${nombre}` : "Sigue con el mapa de campo.",
    };
  }
  return {
    accion: "mapa" as const,
    accionTitulo: "INICIAR RUTA",
    accionDetalle: nombre ? `Siguiente local: ${nombre}` : "Abre el mapa para empezar.",
  };
}

function avisosDe(rutas: RouteItem[]): AvisoRuta[] {
  return rutas
    .filter((item) => !isRecolectado(item.estado) && !isCerrado(item.estado))
    .map((item) => ({
      id: item.id,
      titulo: item.localNombre,
      detalle: [estadoRecojoLabel(item.estado), item.localDireccion].filter(Boolean).join(" · "),
    }));
}
