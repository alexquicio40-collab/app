import { overlayPayload } from "@/lib/offline/overlay";
import { listJobs } from "@/lib/offline/queue";
import { readJsonFile, writeJsonFile } from "@/lib/offline/storage";
import type { CacheEntry } from "@/lib/offline/types";

const FILE = "cache.json";
const MAX_ENTRIES = 80;
const MAX_BYTES = 1_400_000;

type CacheMap = Record<string, CacheEntry>;

let memory: CacheMap | null = null;

async function load(): Promise<CacheMap> {
  if (memory) return memory;
  memory = await readJsonFile<CacheMap>(FILE, {});
  return memory;
}

async function persist(next: CacheMap) {
  memory = next;
  await writeJsonFile(FILE, next);
}

export function cacheKey(path: string) {
  return path;
}

export async function cacheSet(path: string, payload: unknown) {
  let raw = "";
  try {
    raw = JSON.stringify(payload);
  } catch {
    return;
  }
  if (raw.length > MAX_BYTES) return;
  const map = { ...(await load()) };
  map[cacheKey(path)] = { at: Date.now(), payload };
  const keys = Object.keys(map).sort((a, b) => (map[b]?.at ?? 0) - (map[a]?.at ?? 0));
  if (keys.length > MAX_ENTRIES) {
    for (const key of keys.slice(MAX_ENTRIES)) delete map[key];
  }
  await persist(map);
}

export async function cacheGet(path: string) {
  const map = await load();
  return map[cacheKey(path)]?.payload;
}

export async function readWithOverlay(path: string) {
  const cached = await cacheGet(path);
  if (cached == null) return null;
  const jobs = await listJobs();
  return overlayPayload(path, cached, jobs);
}

export async function overlayLive(path: string, payload: unknown) {
  const jobs = await listJobs();
  if (!jobs.length) return payload;
  return overlayPayload(path, payload, jobs);
}
