import type { MiddlewareHandler } from "hono";
import { AppError } from "../utils/http.js";
import { verifyAccessToken } from "../utils/jwt.js";

export type AuthVariables = {
  userId: number;
};

export const requireAuth: MiddlewareHandler<{
  Variables: AuthVariables;
}> = async (c, next) => {
  const header = c.req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Sesión no válida");
  }

  try {
    const payload = await verifyAccessToken(token);
    c.set("userId", Number(payload.sub));
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Sesión no válida");
  }

  await next();
};
