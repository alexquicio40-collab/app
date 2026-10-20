import { createStore, fetchLive } from "@/lib/fast-data";
import type { Recordatorio, RecordatoriosHoy } from "./types";

type Payload = {
  success?: boolean;
  fecha?: string;
  total?: number;
  recordatorios?: Recordatorio[];
};

const recStore = createStore<RecordatoriosHoy>("recordatorios-hoy");

export function peekRecordatoriosHoy() {
  return recStore.peek();
}

export async function fetchRecordatoriosHoy(opts?: { force?: boolean }): Promise<RecordatoriosHoy> {
  if (!opts?.force && recStore.fresh()) {
    const cached = recStore.peek();
    if (cached) return cached;
  }
  const payload = await fetchLive<Payload>("/api/programacion-recojo/recordatorios");
  const items = Array.isArray(payload.recordatorios) ? payload.recordatorios : [];
  const next = {
    fecha: payload.fecha ?? "",
    total: payload.total ?? items.length,
    items,
  };
  recStore.remember(next, true);
  return next;
}
