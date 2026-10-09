import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const SESSION_KEY = "sesionToken";
const USER_KEY = "sesionUser";
const TICKET_KEY = "sesionHasta";
const GRACE_MS = 4 * 60 * 60 * 1000;

export async function setSecureItem(key: string, value: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function removeSecureItem(key: string) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(accessToken: string, refreshToken: string, sessionToken?: string) {
  await Promise.all([
    setSecureItem(ACCESS_KEY, accessToken),
    setSecureItem(REFRESH_KEY, refreshToken),
    sessionToken ? setSecureItem(SESSION_KEY, sessionToken) : Promise.resolve(),
  ]);
}

export async function getSessionToken() {
  return getSecureItem(SESSION_KEY);
}

export async function getAccessToken() {
  return getSecureItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return getSecureItem(REFRESH_KEY);
}

export async function saveUserSnapshot(user: {
  id: number;
  name: string;
  username: string;
  rol?: string;
  localesIds?: string[];
  vinculadoUsuarioId?: string;
}) {
  await setSecureItem(USER_KEY, JSON.stringify(user));
}

export async function getUserSnapshot() {
  const raw = await getSecureItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      id: number;
      name: string;
      username: string;
      rol?: string;
      localesIds?: string[];
      vinculadoUsuarioId?: string;
    };
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function touchSesion() {
  await setSecureItem(TICKET_KEY, String(Date.now() + GRACE_MS));
}

export async function sesionOfflineValida() {
  const hasta = Number(await getSecureItem(TICKET_KEY));
  return Number.isFinite(hasta) && Date.now() < hasta;
}

export async function clearTokens() {
  await Promise.all([
    removeSecureItem(ACCESS_KEY),
    removeSecureItem(REFRESH_KEY),
    removeSecureItem(SESSION_KEY),
    removeSecureItem(USER_KEY),
    removeSecureItem(TICKET_KEY),
  ]);
}

const REMEMBERED_USERNAME_KEY = "rememberedUsername";

export async function saveRememberedUsername(username: string) {
  await setSecureItem(REMEMBERED_USERNAME_KEY, username);
}

export async function getRememberedUsername() {
  return getSecureItem(REMEMBERED_USERNAME_KEY);
}

export async function clearRememberedUsername() {
  await removeSecureItem(REMEMBERED_USERNAME_KEY);
}
