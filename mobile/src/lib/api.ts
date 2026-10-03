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

export function getApiBaseUrl() {
  return BASE_URL;
}

export function getLiveSocketUrl() {
  return SOCKET_URL;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;
  const [userId, sessionToken] = await Promise.all([
    skipAuth ? Promise.resolve(null) : getAccessToken(),
    getSessionToken(),
  ]);

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
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
}

/**
 * Multipart por XMLHttpRequest.
 * El fetch de Expo no acepta `{ uri, name, type }` y en Android lanza
 * "Unsupported FormDataPart". La red nativa sí sube el archivo desde el teléfono.
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
