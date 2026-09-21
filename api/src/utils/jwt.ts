import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export type AccessPayload = {
  sub: string;
  type: "access";
};

export type RefreshPayload = {
  sub: string;
  type: "refresh";
  jti: string;
};

export async function signAccessToken(userId: number) {
  return new SignJWT({ type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret);
}

export async function signRefreshToken(userId: number, jti: string) {
  return new SignJWT({ type: "refresh", jti })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret);

  if (payload.type !== "access" || !payload.sub) {
    throw new Error("Access token inválido");
  }

  return payload as AccessPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret);

  if (payload.type !== "refresh" || !payload.sub || !payload.jti) {
    throw new Error("Refresh token inválido");
  }

  return payload as RefreshPayload;
}

export function refreshExpiresAt() {
  return new Date(Date.now() + REFRESH_TTL_MS);
}
