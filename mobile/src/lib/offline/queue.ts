import { copyIntoOffline, readJsonFile, writeJsonFile } from "@/lib/offline/storage";
import type { JsonJob, OfflineJob, UploadFile, UploadJob } from "@/lib/offline/types";

const FILE = "cola.json";

type Listener = () => void;

const listeners = new Set<Listener>();
let memory: OfflineJob[] | null = null;

export function subscribeJobs(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

async function load() {
  if (memory) return memory;
  memory = await readJsonFile<OfflineJob[]>(FILE, []);
  return memory;
}

async function persist(next: OfflineJob[]) {
  memory = next;
  emit();
  await writeJsonFile(FILE, next);
}

function jobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function jobLabel(method: string, path: string) {
  const base = path.split("?")[0] ?? path;
  if (base.includes("/finalizar")) return "Completar ruta";
  if (base.startsWith("/api/rutas")) {
    if (method === "POST") return "Crear ruta";
    if (method === "DELETE") return "Eliminar ruta";
    return "Editar ruta";
  }
  if (base.startsWith("/api/locales")) return method === "POST" ? "Crear local" : "Editar local";
  if (base.startsWith("/api/users")) return method === "POST" ? "Crear usuario" : "Editar usuario";
  if (base.startsWith("/api/planta")) return "Registro de planta";
  if (base.startsWith("/api/hoja")) return "Hoja de ruta";
  if (base.startsWith("/api/programacion")) return "Programación";
  return "Cambio pendiente";
}

export async function listJobs() {
  return load();
}

export async function enqueueJson(input: {
  method: JsonJob["method"];
  path: string;
  body: unknown;
}) {
  const current = await load();
  const job: JsonJob = {
    id: jobId(),
    kind: "json",
    method: input.method,
    path: input.path,
    body: input.body,
    createdAt: new Date().toISOString(),
    label: jobLabel(input.method, input.path),
  };
  await persist([...current, job]);
  return job;
}

export async function enqueueUpload(input: {
  method: UploadJob["method"];
  path: string;
  fields: Record<string, string>;
  files: UploadFile[];
}) {
  const id = jobId();
  const files: UploadFile[] = [];
  for (const file of input.files) {
    const uri = await copyIntoOffline(file.uri, `${id}-${file.field}-${file.name}`);
    files.push({ ...file, uri });
  }
  const job: UploadJob = {
    id,
    kind: "upload",
    method: input.method,
    path: input.path,
    fields: input.fields,
    files,
    createdAt: new Date().toISOString(),
    label: jobLabel(input.method, input.path),
  };
  const current = await load();
  const next =
    job.path.includes("/finalizar")
      ? current.filter((row) => !(row.kind === "upload" && row.path === job.path))
      : current;
  await persist([...next, job]);
  return job;
}

export async function replaceJobs(next: OfflineJob[]) {
  await persist(next);
}
