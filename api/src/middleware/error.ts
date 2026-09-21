import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { isAppError } from "../utils/http.js";

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return c.json(
      {
        error: first?.message ?? "Datos inválidos",
        code: "VALIDATION_ERROR",
      },
      400,
    );
  }

  if (isAppError(error)) {
    return c.json({ error: error.message, code: error.code }, error.status);
  }

  console.error(error);
  return c.json(
    { error: "Error interno del servidor", code: "INTERNAL_ERROR" },
    500,
  );
};
