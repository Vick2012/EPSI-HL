require("dotenv").config();

const path = require("node:path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { createPgPool, runMigrations } = require("../src/db");

const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, "..", "data", "iris.db");

async function resetSequence(client, tableName) {
  await client.query(
    `
      SELECT setval(
        pg_get_serial_sequence($1, 'id'),
        COALESCE((SELECT MAX(id) FROM ${tableName}), 1),
        (SELECT COUNT(*) > 0 FROM ${tableName})
      )
    `,
    [tableName]
  );
}

async function migrateUsers(sqliteDb, pgClient) {
  const rows = await sqliteDb.all(`
    SELECT id, email, password_hash, role, name, status, visible_password, created_at
    FROM users
    ORDER BY id ASC
  `);

  for (const row of rows) {
    await pgClient.query(
      `
        INSERT INTO users (id, email, password_hash, role, name, status, visible_password, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          visible_password = EXCLUDED.visible_password,
          created_at = EXCLUDED.created_at
      `,
      [
        row.id,
        row.email,
        row.password_hash,
        row.role,
        row.name,
        row.status || "ACTIVO",
        row.visible_password,
        row.created_at,
      ]
    );
  }

  await resetSequence(pgClient, "users");
}

async function migratePasswordResets(sqliteDb, pgClient) {
  const rows = await sqliteDb.all(`
    SELECT id, user_id, token_hash, expires_at, used, created_at
    FROM password_resets
    ORDER BY id ASC
  `);

  for (const row of rows) {
    await pgClient.query(
      `
        INSERT INTO password_resets (id, user_id, token_hash, expires_at, used, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          token_hash = EXCLUDED.token_hash,
          expires_at = EXCLUDED.expires_at,
          used = EXCLUDED.used,
          created_at = EXCLUDED.created_at
      `,
      [
        row.id,
        row.user_id,
        row.token_hash,
        row.expires_at,
        Boolean(row.used),
        row.created_at,
      ]
    );
  }

  await resetSequence(pgClient, "password_resets");
}

async function migrateClientes(sqliteDb, pgClient) {
  const rows = await sqliteDb.all(`
    SELECT id, tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at
    FROM clientes
    ORDER BY id ASC
  `);

  for (const row of rows) {
    await pgClient.query(
      `
        INSERT INTO clientes (
          id, tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (numero_documento) DO UPDATE SET
          tipo_documento = EXCLUDED.tipo_documento,
          dv = EXCLUDED.dv,
          nombre = EXCLUDED.nombre,
          ciudad = EXCLUDED.ciudad,
          direccion = EXCLUDED.direccion,
          telefono = EXCLUDED.telefono,
          email = EXCLUDED.email,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.tipo_documento,
        row.numero_documento,
        row.dv,
        row.nombre,
        row.ciudad,
        row.direccion,
        row.telefono,
        row.email,
        row.created_at,
        row.updated_at,
      ]
    );
  }

  await resetSequence(pgClient, "clientes");
}

async function migrateRemisiones(sqliteDb, pgClient) {
  const rows = await sqliteDb.all(`
    SELECT id, numero, data_json, usuario, anulada, created_at, updated_at
    FROM remisiones
    ORDER BY id ASC
  `);

  for (const row of rows) {
    const dataJson = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
    await pgClient.query(
      `
        INSERT INTO remisiones (id, numero, data_json, usuario, anulada, created_at, updated_at)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
        ON CONFLICT (numero) DO UPDATE SET
          data_json = EXCLUDED.data_json,
          usuario = EXCLUDED.usuario,
          anulada = EXCLUDED.anulada,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.numero,
        JSON.stringify(dataJson),
        row.usuario,
        Boolean(row.anulada),
        row.created_at,
        row.updated_at,
      ]
    );
  }

  await resetSequence(pgClient, "remisiones");
}

async function main() {
  const sqliteDb = await open({
    filename: SQLITE_DB_PATH,
    driver: sqlite3.Database,
  });
  const pgPool = createPgPool();
  const pgClient = await pgPool.connect();

  try {
    await pgPool.query("SELECT 1");
    await runMigrations(pgPool);
    await pgClient.query("BEGIN");
    await pgClient.query("TRUNCATE TABLE password_resets, remisiones, clientes, users RESTART IDENTITY CASCADE");
    await migrateUsers(sqliteDb, pgClient);
    await migratePasswordResets(sqliteDb, pgClient);
    await migrateClientes(sqliteDb, pgClient);
    await migrateRemisiones(sqliteDb, pgClient);
    await pgClient.query("COMMIT");
    console.log("SQLite data migrated to PostgreSQL successfully.");
  } catch (error) {
    await pgClient.query("ROLLBACK");
    console.error("SQLite -> PostgreSQL migration failed:", error);
    process.exitCode = 1;
  } finally {
    pgClient.release();
    await sqliteDb.close();
    await pgPool.end();
  }
}

main().catch((error) => {
  console.error("Migration bootstrap failed:", error);
  process.exit(1);
});
