import type { OfflineJob } from "@/lib/offline/types";

const LIST_KEYS = [
  "usuarios",
  "users",
  "rutas",
  "locales",
  "conductores",
  "programaciones",
  "restricciones",
  "hojas",
  "registros",
  "pagos",
  "certificados",
  "items",
  "recordatorios",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stripQuery(path: string) {
  return path.split("?")[0] ?? path;
}

function resourceName(path: string) {
  const match = stripQuery(path).match(/^\/api\/([^/]+)/);
  return match?.[1] ?? "";
}

function pathId(path: string) {
  const clean = stripQuery(path).replace(/\/finalizar$/, "").replace(/\/fotos\/upload$/, "");
  const match = clean.match(/\/api\/[^/]+\/([^/]+)$/);
  return match?.[1] ?? "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function itemId(item: unknown) {
  const rec = asRecord(item);
  if (!rec) return "";
  return String(rec.id ?? rec.ruta_id ?? rec.usuario_id ?? "");
}

function patchLists(
  payload: Record<string, unknown>,
  fn: (rows: unknown[]) => unknown[],
) {
  for (const key of LIST_KEYS) {
    const rows = payload[key];
    if (Array.isArray(rows)) payload[key] = fn(rows);
  }
}

export function overlayPayload(getPath: string, payload: unknown, jobs: OfflineJob[]) {
  const root = asRecord(payload);
  if (!root || !jobs.length) return payload;
  const getRes = resourceName(getPath);
  const next = clone(root);
  for (const job of jobs) {
    if (resourceName(job.path) !== getRes) continue;
    applyJob(next, job);
  }
  return next;
}

function applyJob(payload: Record<string, unknown>, job: OfflineJob) {
  if (job.kind === "upload") {
    if (job.path.includes("/finalizar")) {
      const id = pathId(job.path);
      patchLists(payload, (rows) =>
        rows.map((row) =>
          itemId(row) === id
            ? { ...(asRecord(row) ?? {}), estado: "recolectado", fecha_completada: job.createdAt }
            : row,
        ),
      );
    }
    return;
  }

  const id = pathId(job.path);

  if (job.method === "POST") {
    const body = asRecord(job.body) ?? {};
    patchLists(payload, (rows) => [
      ...rows,
      { id: `off-${job.id}`, ...body, _offline: true },
    ]);
    return;
  }

  if (job.method === "DELETE" && id) {
    patchLists(payload, (rows) => rows.filter((row) => itemId(row) !== id));
    return;
  }

  if ((job.method === "PUT" || job.method === "PATCH") && id) {
    const body = asRecord(job.body) ?? {};
    patchLists(payload, (rows) =>
      rows.map((row) => (itemId(row) === id ? { ...(asRecord(row) ?? {}), ...body } : row)),
    );
  }
}
