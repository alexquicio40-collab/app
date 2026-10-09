import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const DIR_NAME = "offline";

let chain: Promise<void> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = chain.then(work, work);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function rootDir() {
  return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${DIR_NAME}/` : null;
}

export function offlineFileUri(name: string) {
  const root = rootDir();
  return root ? `${root}${name}` : null;
}

export async function readJsonFile<T>(name: string, fallback: T): Promise<T> {
  return enqueue(async () => {
    try {
      if (Platform.OS === "web") {
        const raw = globalThis.localStorage?.getItem(`bioclim-${name}`);
        return raw ? (JSON.parse(raw) as T) : fallback;
      }
      const root = rootDir();
      if (!root) return fallback;
      const uri = `${root}${name}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return fallback;
      return JSON.parse(await FileSystem.readAsStringAsync(uri)) as T;
    } catch {
      return fallback;
    }
  });
}

export async function writeJsonFile(name: string, value: unknown) {
  return enqueue(async () => {
    const raw = JSON.stringify(value);
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(`bioclim-${name}`, raw);
      return;
    }
    const root = rootDir();
    if (!root) return;
    await FileSystem.makeDirectoryAsync(root, { intermediates: true });
    await FileSystem.writeAsStringAsync(`${root}${name}`, raw);
  });
}

export async function copyIntoOffline(uri: string, destName: string) {
  if (Platform.OS === "web") return uri;
  if (!uri || uri.startsWith("data:") || uri.startsWith("blob:")) return uri;
  const root = rootDir();
  if (!root) return uri;
  await FileSystem.makeDirectoryAsync(root, { intermediates: true });
  const dest = `${root}${destName}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
