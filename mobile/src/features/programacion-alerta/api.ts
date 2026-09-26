import { api } from "@/lib/api";
import type { Recordatorio, RecordatoriosHoy } from "./types";

type Payload = {
  success?: boolean;
  fecha?: string;
  total?: number;
  recordatorios?: Recordatorio[];
};

export async function fetchRecordatoriosHoy(): Promise<RecordatoriosHoy> {
  const payload = await api<Payload>("/api/programacion-recojo/recordatorios");
  const items = Array.isArray(payload.recordatorios) ? payload.recordatorios : [];
  return {
    fecha: payload.fecha ?? "",
    total: payload.total ?? items.length,
    items,
  };
}
