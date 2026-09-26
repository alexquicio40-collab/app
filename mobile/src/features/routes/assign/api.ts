import { api } from "@/lib/api";
import { fetchLocalesLite } from "@/features/locales/api";
import type {
  AssignRouteInput,
  LocalOption,
  RestrictionInput,
  RestrictionItem,
  ScheduleInput,
  ScheduleItem,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRows(payload: unknown, key: string): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    const nested = payload[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
  }
  return [];
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    const next = String(value).trim();
    if (next) return next;
  }
  return "";
}

function num(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Lista liviana + cache compartida (misma que Hoja ruta). */
export async function fetchLocales(opts?: { force?: boolean }): Promise<LocalOption[]> {
  return fetchLocalesLite({ force: opts?.force });
}

export async function createRoute(input: AssignRouteInput) {
  return api<{ success?: boolean; message?: string }>("/api/rutas", {
    method: "POST",
    body: {
      conductor_id: Number(input.conductorId),
      local_id: Number(input.localId),
      fecha_asignacion: input.fechaAsignacion.trim().slice(0, 10),
      observaciones: input.observaciones,
    },
  });
}

export async function updateRoute(id: string, body: Record<string, unknown>) {
  return api<{ success?: boolean; message?: string }>(`/api/rutas/${id}`, {
    method: "PUT",
    body,
  });
}

export async function deleteRoute(id: string) {
  return api<{ success?: boolean; message?: string }>(`/api/rutas/${id}`, {
    method: "DELETE",
  });
}

export async function fetchSchedules(): Promise<ScheduleItem[]> {
  const payload = await api<unknown>("/api/programacion-recojo").catch(() => ({ programaciones: [] }));
  return asRows(payload, "programaciones")
    .map((row) => {
      const id = num(row.id);
      if (id == null) return null;
      return {
        id,
        localId: text(row.local_id),
        conductorId: text(row.conductor_id),
        frecuencia: text(row.frecuencia) || "semanal",
        diasSemana: text(row.dias_semana),
        diasMes: text(row.dias_mes),
        horaVisita: text(row.hora_visita).slice(0, 5),
        observaciones: text(row.observaciones),
        activo: row.activo === 1 || row.activo === true,
        localNombre: text(row.local_nombre) || "Local",
        conductorNombre: text(row.conductor_nombre) || "Operador",
      };
    })
    .filter((item): item is ScheduleItem => Boolean(item));
}

export async function createSchedule(input: ScheduleInput) {
  return api<{ success?: boolean; message?: string }>("/api/programacion-recojo", {
    method: "POST",
    body: {
      local_id: Number(input.localId),
      conductor_id: Number(input.conductorId),
      frecuencia: input.frecuencia,
      dias_semana: input.diasSemana,
      dias_mes: input.diasMes,
      hora_visita: input.horaVisita,
      observaciones: input.observaciones,
      activo: 1,
    },
  });
}

export async function updateSchedule(id: number, input: ScheduleInput & { activo?: boolean }) {
  return api<{ success?: boolean; message?: string }>(`/api/programacion-recojo/${id}`, {
    method: "PUT",
    body: {
      local_id: Number(input.localId),
      conductor_id: Number(input.conductorId),
      frecuencia: input.frecuencia,
      dias_semana: input.diasSemana,
      dias_mes: input.diasMes,
      hora_visita: input.horaVisita,
      observaciones: input.observaciones,
      activo: input.activo === false ? 0 : 1,
    },
  });
}

export async function deleteSchedule(id: number) {
  return api<{ success?: boolean; message?: string }>(`/api/programacion-recojo/${id}`, {
    method: "DELETE",
  });
}

export async function generateScheduledRoutes(desde: string, hasta: string) {
  return api<{ success?: boolean; creadas?: number; message?: string }>(
    "/api/programacion-recojo/generar-asignaciones",
    {
      method: "POST",
      body: { desde_fecha: desde, hasta_fecha: hasta },
    },
  );
}

export async function fetchRestrictions(): Promise<RestrictionItem[]> {
  const payload = await api<unknown>("/api/restricciones-viales/admin").catch(() =>
    api<unknown>("/api/restricciones-viales").catch(() => ({ restricciones: [] })),
  );

  return asRows(payload, "restricciones")
    .map((row) => {
      const id = num(row.id);
      const minLat = num(row.min_lat);
      const maxLat = num(row.max_lat);
      const minLng = num(row.min_lng);
      const maxLng = num(row.max_lng);
      if (id == null || minLat == null || maxLat == null || minLng == null || maxLng == null) return null;
      return {
        id,
        tipoVehiculo: text(row.tipo_vehiculo) || "ambos",
        nombre: text(row.nombre) || `Zona ${id}`,
        minLat,
        maxLat,
        minLng,
        maxLng,
        activo: row.activo === 1 || row.activo === true || row.activo == null,
      };
    })
    .filter((item): item is RestrictionItem => Boolean(item));
}

export async function createRestriction(input: RestrictionInput) {
  return api<{ success?: boolean; message?: string }>("/api/restricciones-viales", {
    method: "POST",
    body: {
      tipo_vehiculo: input.tipoVehiculo,
      tipo_via: "via",
      nombre: input.nombre,
      min_lat: input.minLat,
      max_lat: input.maxLat,
      min_lng: input.minLng,
      max_lng: input.maxLng,
    },
  });
}

export async function updateRestriction(id: number, body: Record<string, unknown>) {
  return api<{ success?: boolean; message?: string }>(`/api/restricciones-viales/${id}`, {
    method: "PUT",
    body,
  });
}

export async function deleteRestriction(id: number) {
  return api<{ success?: boolean; message?: string }>(`/api/restricciones-viales/${id}`, {
    method: "DELETE",
  });
}
