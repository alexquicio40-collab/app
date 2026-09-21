import mysql from "mysql2/promise";
import { env } from "../config/env.js";

async function init() {
  const root = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  });

  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await root.end();

  const db = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nombre VARCHAR(120) NOT NULL,
      usuario VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      rol VARCHAR(40) NOT NULL DEFAULT 'operador',
      activo TINYINT(1) NOT NULL DEFAULT 1,
      dni VARCHAR(20) NULL,
      placa VARCHAR(20) NULL,
      permisos_menu TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY idx_usuario (usuario)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY refresh_tokens_hash_unique (token_hash),
      KEY refresh_tokens_user_id (user_id)
    ) ENGINE=InnoDB
  `);

  await db.end();
  console.log(`Base ${env.DB_NAME} lista (tabla usuarios).`);
}

init().catch((error) => {
  console.error("No se pudo inicializar la base de datos.");
  console.error(error);
  process.exit(1);
});
