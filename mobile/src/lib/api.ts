import { getAccessToken } from "./secure-store";

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
  const userId = skipAuth ? null : await getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "X-User-Id": userId } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return parseApiResponse<T>(response);
}

/** Multipart sin forzar Content-Type (el boundary lo pone fetch). */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { skipAuth?: boolean; method?: "POST" | "PUT" } = {},
): Promise<T> {
  const userId = options.skipAuth ? null : await getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "POST",
    credentials: "include",
    headers: {
      ...(userId ? { "X-User-Id": userId } : {}),
    },
    body: formData,
  });

  return parseApiResponse<T>(response);
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok || (payload as ApiErrorBody).success === false) {
    const message =
      (payload as ApiErrorBody).message ||
      (payload as ApiErrorBody).error ||
      "No se pudo completar la solicitud";
    throw new ApiError(response.status, (payload as ApiErrorBody).code ?? "REQUEST_FAILED", message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return payload as T;
}

export function limaDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}
