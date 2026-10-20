import { apiOnline } from "@/lib/api";
import { readJsonFile, writeJsonFile } from "@/lib/offline/storage";

const TTL_MS = 3 * 60 * 1000;
const SNAP_MAX_BYTES = 400_000;

type Slot = { at: number; value: unknown };

const memory = new Map<string, Slot>();

export function fetchLive<T>(path: string): Promise<T> {
  return apiOnline<T>(path);
}

export function asRecordRows(payload: unknown, ...keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row),
    );
  }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    for (const key of keys) {
      const nested = (payload as Record<string, unknown>)[key];
      if (Array.isArray(nested)) {
        return nested.filter(
          (row): row is Record<string, unknown> =>
            Boolean(row) && typeof row === "object" && !Array.isArray(row),
        );
      }
    }
  }
  return [];
}

export async function mapRows<T, R>(
  rows: R[],
  parse: (row: R) => T | null,
  opts?: {
    onPartial?: (items: T[]) => void;
    firstPaint?: number;
    yieldEvery?: number;
  },
): Promise<T[]> {
  const firstPaint = opts?.firstPaint ?? 12;
  const yieldEvery = opts?.yieldEvery ?? 80;
  const items: T[] = [];
  let painted = false;
  for (let i = 0; i < rows.length; i += 1) {
    const item = parse(rows[i]!);
    if (!item) continue;
    items.push(item);
    if (!painted && items.length === firstPaint) {
      painted = true;
      opts?.onPartial?.(items.slice());
    }
    if (i > 0 && i % yieldEvery === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  return items;
}

export type ValueStore<T> = {
  peek(): T | null;
  fresh(): boolean;
  remember(value: T, persist?: boolean): void;
  invalidate(): void;
  peekSnap(): Promise<T | null>;
};

export function createStore<T>(key: string, ttlMs = TTL_MS): ValueStore<T> {
  const file = `fast-${key}.json`;
  return {
    peek() {
      const hit = memory.get(key);
      return hit ? (hit.value as T) : null;
    },
    fresh() {
      const hit = memory.get(key);
      return Boolean(hit && Date.now() - hit.at < ttlMs);
    },
    remember(value, persist = false) {
      memory.set(key, { at: Date.now(), value });
      if (persist) persistSafe(file, value);
    },
    invalidate() {
      memory.delete(key);
    },
    async peekSnap() {
      const snap = await readJsonFile<{ value?: T }>(file, {});
      return snap.value ?? null;
    },
  };
}

export type ListStore<T> = {
  peek(): T[] | null;
  fresh(): boolean;
  remember(items: T[]): void;
  seed(items: T[]): void;
  invalidate(): void;
  peekSnap(): Promise<T[] | null>;
};

export function createListStore<T>(key: string, opts?: { ttlMs?: number; snapSize?: number }): ListStore<T> {
  const store = createStore<{ items: T[] }>(key, opts?.ttlMs);
  const snapSize = opts?.snapSize ?? 40;
  return {
    peek() {
      return store.peek()?.items ?? null;
    },
    fresh() {
      return store.fresh();
    },
    remember(items) {
      store.remember({ items }, false);
      persistSafe(`fast-${key}.json`, { items: items.slice(0, snapSize) });
    },
    seed(items) {
      if (items.length) this.remember(items);
    },
    invalidate() {
      store.invalidate();
    },
    async peekSnap() {
      return (await store.peekSnap())?.items ?? null;
    },
  };
}

function persistSafe(file: string, value: unknown) {
  try {
    const wrapped = { at: Date.now(), value };
    if (JSON.stringify(wrapped).length > SNAP_MAX_BYTES) return;
    void writeJsonFile(file, wrapped);
  } catch {
    // el snap es opcional: no bloquea la pantalla
  }
}
