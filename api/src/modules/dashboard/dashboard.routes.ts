import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../../middleware/auth.js";
import * as dashboardController from "./dashboard.controller.js";

export const dashboardRoutes = new Hono<{ Variables: AuthVariables }>().get(
  "/summary",
  requireAuth,
  dashboardController.summary,
);
