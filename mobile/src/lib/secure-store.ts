import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

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

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    setSecureItem(ACCESS_KEY, accessToken),
    setSecureItem(REFRESH_KEY, refreshToken),
  ]);
}

export async function getAccessToken() {
  return getSecureItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return getSecureItem(REFRESH_KEY);
}

export async function clearTokens() {
  await Promise.all([removeSecureItem(ACCESS_KEY), removeSecureItem(REFRESH_KEY)]);
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
