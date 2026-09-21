import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "El usuario es obligatorio")
  .max(100, "El usuario no puede superar 100 caracteres");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  username: usernameSchema,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "La contraseña es obligatoria").max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token obligatorio"),
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
