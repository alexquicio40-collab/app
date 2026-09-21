import type { Context } from "hono";
import type { AuthVariables } from "../../middleware/auth.js";
import { getSummary } from "./dashboard.service.js";

export async function summary(_c: Context<{ Variables: AuthVariables }>) {
  const data = await getSummary();
  return _c.json(data);
}
