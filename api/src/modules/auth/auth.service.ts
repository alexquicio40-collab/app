import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";
import { newId, sha256 } from "../../utils/crypto.js";
import { AppError } from "../../utils/http.js";
import {
  refreshExpiresAt,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { loginAgainstLegacy } from "./legacy-login.js";

type UserRow = RowDataPacket & {
  id: number;
  nombre: string;
  usuario: string;
  password: string;
  rol: string;
  activo: number;
};

type PublicUser = {
  id: number;
  name: string;
  username: string;
  rol: string;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

function toPublicUser(user: Pick<UserRow, "id" | "nombre" | "usuario" | "rol">): PublicUser {
  return {
    id: user.id,
    name: user.nombre || user.usuario,
    username: user.usuario,
    rol: user.rol,
  };
}

async function findByUsername(username: string) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, nombre, usuario, password, rol, activo
     FROM usuarios
     WHERE usuario = :username
        OR nombre = :username
        OR TRIM(TRAILING '.' FROM usuario) = TRIM(TRAILING '.' FROM :username)
     LIMIT 1`,
    { username },
  );
  return rows[0] ?? null;
}

async function passwordMatches(plain: string, passwordHash: string) {
  if (await verifyPassword(plain, passwordHash)) return true;
  const withoutDot = plain.replace(/\.+$/, "");
  if (withoutDot !== plain && (await verifyPassword(withoutDot, passwordHash))) return true;
  if (!plain.endsWith(".") && (await verifyPassword(`${plain}.`, passwordHash))) return true;
  return false;
}

async function findById(id: number) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, nombre, usuario, password, rol, activo
     FROM usuarios
     WHERE id = :id
     LIMIT 1`,
    { id },
  );
  return rows[0] ?? null;
}

async function upsertFromLegacy(
  legacy: { id: number; nombre: string; usuario: string; rol: string },
  password: string,
) {
  const passwordHash = await hashPassword(password);
  await pool.query(
    `INSERT INTO usuarios (id, nombre, usuario, password, rol, activo)
     VALUES (:id, :nombre, :usuario, :passwordHash, :rol, 1)
     ON DUPLICATE KEY UPDATE
       nombre = VALUES(nombre),
       usuario = VALUES(usuario),
       password = VALUES(password),
       rol = VALUES(rol),
       activo = 1`,
    {
      id: legacy.id,
      nombre: legacy.nombre,
      usuario: legacy.usuario,
      passwordHash,
      rol: legacy.rol,
    },
  );

  const user = await findById(legacy.id);
  if (!user) {
    throw new AppError(500, "INTERNAL_ERROR", "No se pudo sincronizar el usuario");
  }
  return user;
}

async function issueSession(user: UserRow): Promise<AuthResult> {
  const jti = newId();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id),
    signRefreshToken(user.id, jti),
    pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (:userId, :tokenHash, :expiresAt)`,
      {
        userId: user.id,
        tokenHash: sha256(jti),
        expiresAt: refreshExpiresAt(),
      },
    ),
  ]);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

export async function register(input: RegisterInput) {
  const existing = await findByUsername(input.username);
  if (existing) {
    throw new AppError(409, "USERNAME_TAKEN", "Ese usuario ya está registrado");
  }

  const passwordHash = await hashPassword(input.password);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO usuarios (nombre, usuario, password, rol, activo)
     VALUES (:name, :username, :passwordHash, 'operador', 1)`,
    {
      name: input.name,
      username: input.username,
      passwordHash,
    },
  );

  const user = await findById(result.insertId);
  if (!user) {
    throw new AppError(500, "INTERNAL_ERROR", "No se pudo crear el usuario");
  }

  return issueSession(user);
}

export async function login(input: LoginInput) {
  const local = await findByUsername(input.username);
  const localValid =
    local && local.activo !== 0 ? await passwordMatches(input.password, local.password) : false;

  if (local && localValid) {
    return issueSession(local);
  }

  if (local && local.activo === 0) {
    throw new AppError(403, "UNAUTHORIZED", "Su usuario está temporalmente desactivado");
  }

  const legacy = await loginAgainstLegacy(input.username, input.password);
  if (!legacy) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
  }

  const synced = await upsertFromLegacy(legacy, input.password);
  return issueSession(synced);
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Sesión no válida");
  }

  const tokenHash = sha256(payload.jti);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM refresh_tokens
     WHERE token_hash = :tokenHash AND user_id = :userId AND expires_at > NOW()
     LIMIT 1`,
    { tokenHash, userId: Number(payload.sub) },
  );

  if (!rows[0]) {
    throw new AppError(401, "UNAUTHORIZED", "Sesión no válida");
  }

  await pool.query("DELETE FROM refresh_tokens WHERE id = :id", { id: rows[0].id });

  const user = await findById(Number(payload.sub));
  if (!user || user.activo === 0) {
    throw new AppError(401, "UNAUTHORIZED", "Sesión no válida");
  }

  return issueSession(user);
}

export async function logout(refreshToken: string) {
  try {
    const payload = await verifyRefreshToken(refreshToken);
    await pool.query("DELETE FROM refresh_tokens WHERE token_hash = :tokenHash", {
      tokenHash: sha256(payload.jti),
    });
  } catch {
    // Ya inválido: el cliente igual cierra sesión.
  }
}

export async function me(userId: number) {
  const user = await findById(userId);
  if (!user || user.activo === 0) {
    throw new AppError(401, "UNAUTHORIZED", "Sesión no válida");
  }

  return toPublicUser(user);
}
