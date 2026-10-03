import { finalizarRuta } from "@/features/routes/flujo/api";
import type { FinalizarRutaInput, PendingFoto } from "@/features/routes/flujo/types";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const STORAGE_KEY = "bioclim-recojos";
const FILE_NAME = "recojos-cola.json";

export type RecojoPendiente = {
  id: string;
  rutaId: string;
  localNombre: string;
  input: FinalizarRutaInput;
  creadoEn: string;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: RecojoPendiente[] | null = null;

export function subscribeRecojos(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function isNetworkError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /network request failed|failed to fetch|internet|offline|network error|timed out|timeout|abort/i.test(
    message,
  );
}

function fileUri() {
  const root = FileSystem.documentDirectory;
  return root ? `${root}${FILE_NAME}` : null;
}

async function readDisk(): Promise<RecojoPendiente[]> {
  if (cache) return cache;
  try {
    if (Platform.OS === "web") {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      cache = raw ? (JSON.parse(raw) as RecojoPendiente[]) : [];
      return cache;
    }
    const uri = fileUri();
    if (!uri) {
      cache = [];
      return cache;
    }
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      cache = [];
      return cache;
    }
    cache = JSON.parse(await FileSystem.readAsStringAsync(uri)) as RecojoPendiente[];
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

async function writeDisk(items: RecojoPendiente[]) {
  cache = items;
  emit();
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(items));
    return;
  }
  const uri = fileUri();
  if (!uri) return;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(items));
}

async function persistFoto(foto: PendingFoto | null, rutaId: string, slot: string) {
  if (!foto || Platform.OS === "web" || !FileSystem.documentDirectory) return foto;
  if (foto.uri.startsWith("data:") || foto.uri.startsWith("blob:")) return foto;
  const dir = `${FileSystem.documentDirectory}recojos/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${rutaId}-${slot}.jpg`;
  await FileSystem.copyAsync({ from: foto.uri, to: dest });
  return { ...foto, uri: dest };
}

export async function listRecojos() {
  return readDisk();
}

export async function enqueueRecojo(item: {
  rutaId: string;
  localNombre: string;
  input: FinalizarRutaInput;
}) {
  const current = await readDisk();
  const input: FinalizarRutaInput = {
    ...item.input,
    fotoGuia: await persistFoto(item.input.fotoGuia, item.rutaId, "guia"),
    fotoMercaderia: await persistFoto(item.input.fotoMercaderia, item.rutaId, "mercaderia"),
    fotoPago: await persistFoto(item.input.fotoPago, item.rutaId, "pago"),
  };
  const next: RecojoPendiente = {
    id: `${item.rutaId}-${Date.now()}`,
    rutaId: item.rutaId,
    localNombre: item.localNombre,
    input,
    creadoEn: new Date().toISOString(),
  };
  await writeDisk([...current.filter((row) => row.rutaId !== item.rutaId), next]);
}

/** Envía la cola. Lo que falle por red se queda para el siguiente intento. */
export async function flushRecojos() {
  const current = await readDisk();
  if (!current.length) return { sent: 0, left: 0 };
  const left: RecojoPendiente[] = [];
  let sent = 0;
  for (const item of current) {
    try {
      await finalizarRuta(item.rutaId, item.input);
      sent += 1;
    } catch {
      left.push(item);
    }
  }
  await writeDisk(left);
  return { sent, left: left.length };
}
