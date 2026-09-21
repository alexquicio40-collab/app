import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    setItem(ACCESS_KEY, accessToken),
    setItem(REFRESH_KEY, refreshToken),
  ]);
}

export async function getAccessToken() {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return getItem(REFRESH_KEY);
}

export async function clearTokens() {
  await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY)]);
}

const REMEMBERED_USERNAME_KEY = "rememberedUsername";

export async function saveRememberedUsername(username: string) {
  await setItem(REMEMBERED_USERNAME_KEY, username);
}

export async function getRememberedUsername() {
  return getItem(REMEMBERED_USERNAME_KEY);
}

export async function clearRememberedUsername() {
  await removeItem(REMEMBERED_USERNAME_KEY);
}
