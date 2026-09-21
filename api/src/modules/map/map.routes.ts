import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../../middleware/auth.js";
import * as mapController from "./map.controller.js";

export const mapRoutes = new Hono<{ Variables: AuthVariables }>().get("/live", requireAuth, mapController.live);
