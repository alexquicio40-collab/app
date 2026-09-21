import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(1, "El usuario es obligatorio")
  .max(100, "El usuario no puede superar 100 caracteres");

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  username: usernameSchema,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
