import { cacheSet, overlayLive, readWithOverlay } from "@/lib/offline/cache";
import { formToFieldsAndFiles } from "@/lib/offline/form-parts";
import { isNetworkError } from "@/lib/offline/net";
import { enqueueJson, enqueueUpload } from "@/lib/offline/queue";
import type { QueuedResult } from "@/lib/offline/types";
import { hayInternet } from "@/lib/red";
import { hoy } from "./fecha-lima";
import { getAccessToken, getSessionToken, touchSesion } from "./secure-store";
import { emitSessionClosed } from "./session-bus";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
  success?: boolean;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://ubicacion.vezper.pe").replace(/\/$/, "");
const SOCKET_URL = (process.env.EXPO_PUBLIC_SOCKET_URL ?? "https://ubicacion.vezper.pe").replace(/\/$/, "");
const JSON_TIMEOUT_MS = 20000;

export function getApiBaseUrl() {
  return BASE_URL;
}

export function getLiveSocketUrl() {
  return SOCKET_URL;
}

function bypassOffline(path: string, skipAuth?: boolean) {
  if (skipAuth) return true;
  return /^\/api\/(login|logout|session)(\?|$)/.test(path);
}

function methodOf(options: RequestOptions) {
  return String(options.method ?? "GET").toUpperCase();
}

function queued<T>(): T {
  return { success: true, queued: true } as QueuedResult as T;
}

/** Fetch directo. Lo usa la sincronización para no volver a encolar. */
export async function apiOnline<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, signal, ...rest } = options;
  const [userId, sessionToken] = await Promise.all([
    skipAuth ? Promise.resolve(null) : getAccessToken(),
    getSessionToken(),
  ]);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), JSON_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      signal: ctrl.signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "X-User-Id": userId } : {}),
        ...(sessionToken ? { "X-Session-Token": sessionToken } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return parseApiResponse<T>(response);
  } finally {
    clearTimeout(timer);
  }
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = methodOf(options);
  const skip = bypassOffline(path, options.skipAuth);
  const online = skip ? true : await hayInternet();

  if (method === "GET" || method === "HEAD") {
    if (!online && !skip) {
      const cached = await readWithOverlay(path);
      if (cached != null) return cached as T;
      throw new ApiError(0, "OFFLINE", "Sin internet. Entra a esta pantalla con señal una vez para usarla sin red.");
    }
    try {
      const data = await apiOnline<T>(path, options);
      if (!skip) {
        await cacheSet(path, data);
        return (await overlayLive(path, data)) as T;
      }
      return data;
    } catch (err) {
      if (skip || !isNetworkError(err)) throw err;
      const cached = await readWithOverlay(path);
      if (cached != null) return cached as T;
      throw err;
    }
  }

  if (skip) return apiOnline<T>(path, options);

  if (!online) {
    await enqueueJson({
      method: method as "POST" | "PUT" | "PATCH" | "DELETE",
      path,
      body: options.body,
    });
    return queued<T>();
  }

  try {
    return await apiOnline<T>(path, options);
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    await enqueueJson({
      method: method as "POST" | "PUT" | "PATCH" | "DELETE",
      path,
      body: options.body,
    });
    return queued<T>();
  }
}

export async function apiUploadOnline<T>(
  path: string,
  formData: FormData,
  options: {
    skipAuth?: boolean;
    method?: "POST" | "PUT";
    onProgress?: (loaded: number, total: number) => void;
  } = {},
): Promise<T> {
  const [userId, sessionToken] = await Promise.all([
    options.skipAuth ? Promise.resolve(null) : getAccessToken(),
    getSessionToken(),
  ]);
  const response = await sendMultipart(`${BASE_URL}${path}`, formData, {
    method: options.method ?? "POST",
    userId,
    sessionToken,
    onProgress: options.onProgress,
  });
  return parseApiResponse<T>(response);
}

/**
 * Multipart por XMLHttpRequest.
 * Sin red, guarda archivos en el teléfono y los sube al recuperar señal.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: {
    skipAuth?: boolean;
    method?: "POST" | "PUT";
    onProgress?: (loaded: number, total: number) => void;
  } = {},
): Promise<T> {
  if (options.skipAuth || bypassOffline(path, options.skipAuth)) {
    return apiUploadOnline<T>(path, formData, options);
  }

  const park = async () => {
    const parsed = formToFieldsAndFiles(formData);
    await enqueueUpload({
      method: options.method ?? "POST",
      path,
      fields: parsed.fields,
      files: parsed.files,
    });
    return queued<T>();
  };

  if (!(await hayInternet())) return park();

  try {
    return await apiUploadOnline<T>(path, formData, options);
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    return park();
  }
}

function sendMultipart(
  url: string,
  formData: FormData,
  options: {
    method: string;
    userId: string | null;
    sessionToken?: string | null;
    onProgress?: (loaded: number, total: number) => void;
  },
) {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method, url);
    xhr.withCredentials = true;
    xhr.responseType = "text";
    xhr.timeout = 120000;
    if (options.userId) xhr.setRequestHeader("X-User-Id", options.userId);
    if (options.sessionToken) xhr.setRequestHeader("X-Session-Token", options.sessionToken);
    xhr.upload.onprogress = (event) => {
      options.onProgress?.(event.loaded, event.lengthComputable ? event.total : 0);
    };
    xhr.onload = () => {
      const status = xhr.status;
      if (status < 200 || status > 599) {
        reject(new Error("No se pudo enviar el archivo"));
        return;
      }
      resolve(new Response(xhr.responseText || "", { status }));
    };
    xhr.onerror = () => reject(new Error("No se pudo enviar el archivo"));
    xhr.ontimeout = () => reject(new Error("Se agotó el tiempo de carga"));
    xhr.send(formData);
  });
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok || (payload as ApiErrorBody).success === false) {
    const code = (payload as ApiErrorBody).code ?? "REQUEST_FAILED";
    if (code === "SESSION_CLOSED") emitSessionClosed();
    const message =
      (payload as ApiErrorBody).message ||
      (payload as ApiErrorBody).error ||
      "No se pudo completar la solicitud";
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) {
    void touchSesion();
    return undefined as T;
  }

  void touchSesion();
  return payload as T;
}

export function limaDate() {
  return hoy();
}
