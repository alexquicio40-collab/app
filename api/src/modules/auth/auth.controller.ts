import type { Context } from "hono";
import type { AuthVariables } from "../../middleware/auth.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "./auth.schema.js";
import * as authService from "./auth.service.js";

export async function register(c: Context) {
  const body = registerSchema.parse(await c.req.json());
  const result = await authService.register(body);
  return c.json(result, 201);
}

export async function login(c: Context) {
  const body = loginSchema.parse(await c.req.json());
  const result = await authService.login(body);
  return c.json(result);
}

export async function refresh(c: Context) {
  const body = refreshSchema.parse(await c.req.json());
  const result = await authService.refresh(body.refreshToken);
  return c.json(result);
}

export async function logout(c: Context) {
  const body = logoutSchema.parse(await c.req.json());
  await authService.logout(body.refreshToken);
  return c.json({ ok: true });
}

export async function me(c: Context<{ Variables: AuthVariables }>) {
  const user = await authService.me(c.get("userId"));
  return c.json({ user });
}
