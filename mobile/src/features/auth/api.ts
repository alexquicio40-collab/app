import { api, ApiError } from "@/lib/api";
import type { AuthResult, User } from "./types";

type WebUser = {
  id: number;
  nombre?: string;
  usuario?: string;
  rol?: string;
};

type LoginResponse = {
  success: boolean;
  user: WebUser;
};

type SessionResponse = {
  authenticated?: boolean;
  user?: WebUser;
};

function toUser(user: WebUser): User {
  return {
    id: Number(user.id),
    name: user.nombre || user.usuario || "Usuario",
    username: user.usuario || user.nombre || "",
    rol: user.rol,
  };
}

function toAuthResult(user: WebUser): AuthResult {
  const id = String(user.id);
  return {
    accessToken: id,
    refreshToken: id,
    user: toUser(user),
  };
}

async function tryLogin(usuario: string, password: string) {
  const data = await api<LoginResponse>("/api/login", {
    method: "POST",
    skipAuth: true,
    body: { usuario, password },
  });
  return toAuthResult(data.user);
}

export async function loginRequest(username: string, password: string) {
  const userTrim = username.trim();
  const passTrim = password.trim();
  const users = [...new Set([userTrim, userTrim.replace(/\.+$/, ""), userTrim.endsWith(".") ? userTrim : `${userTrim}.`])].filter(
    Boolean,
  );
  const passwords = [...new Set([passTrim, passTrim.replace(/\.+$/, ""), passTrim.endsWith(".") ? passTrim : `${passTrim}.`])].filter(
    Boolean,
  );

  let lastError: unknown = null;
  for (const usuario of users) {
    for (const pass of passwords) {
      try {
        return await tryLogin(usuario, pass);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 403 || error.status === 400)) {
          throw error;
        }
        lastError = error;
      }
    }
  }

  throw lastError;
}

export function registerRequest(_name: string, _username: string, _password: string): Promise<AuthResult> {
  return Promise.reject(
    new ApiError(400, "NOT_SUPPORTED", "El alta de usuarios se hace desde el panel web"),
  );
}

export function meRequest() {
  return api<SessionResponse>("/api/session").then((data) => {
    if (!data.user?.id) {
      throw new Error("Sesión no válida");
    }
    return { user: toUser(data.user) };
  });
}

export function logoutRequest() {
  return api<{ success?: boolean }>("/api/logout", {
    method: "POST",
    skipAuth: true,
  });
}
