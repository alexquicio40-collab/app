import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../../middleware/auth.js";
import * as authController from "./auth.controller.js";

export const authRoutes = new Hono<{ Variables: AuthVariables }>()
  .post("/register", authController.register)
  .post("/login", authController.login)
  .post("/refresh", authController.refresh)
  .post("/logout", authController.logout)
  .get("/me", requireAuth, authController.me);
