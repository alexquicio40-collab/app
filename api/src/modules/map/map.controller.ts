import type { Context } from "hono";
import type { AuthVariables } from "../../middleware/auth.js";
import { getLiveMap } from "./map.service.js";

export async function live(_c: Context<{ Variables: AuthVariables }>) {
  return _c.json(await getLiveMap());
}
