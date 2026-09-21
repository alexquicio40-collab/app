import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { corsOrigins, env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { mapRoutes } from "./modules/map/map.routes.js";

const app = new Hono();

app.onError(errorHandler);

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return corsOrigins[0] ?? "*";
      if (corsOrigins.includes(origin)) return origin;
      if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(origin)) {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) => c.json({ ok: true }));
app.route("/auth", authRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/map", mapRoutes);

serve({ fetch: app.fetch, hostname: "0.0.0.0", port: env.PORT }, (info) => {
  console.log(`API lista en http://localhost:${info.port}`);
});
