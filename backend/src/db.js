const path = require("node:path");
const fs = require("node:fs");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

let dbInstance;
let poolInstance;
let initPromise;

function getPoolConfig() {
  const useSsl = process.env.PGSSL === "1" || process.env.DB_SSL === "1";
  const socketHost = process.env.INSTANCE_UNIX_SOCKET
    || (process.env.INSTANCE_CONNECTION_NAME
      ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
      : undefined);
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    };
  }

  return {
    host: process.env.DB_HOST || process.env.PGHOST || socketHost || "127.0.0.1",
    port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
    user: process.env.DB_USER || process.env.PGUSER || "postgres",
    password: process.env.DB_PASSWORD || process.env.DB_PASS || process.env.PGPASSWORD || "",
    database: process.env.DB_NAME || process.env.PGDATABASE || "epsi_hl",
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  };
}

function createPgPool() {
  return new Pool(getPoolConfig());
}

function normalizeParams(params) {
  return params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
}

function createAdapter(clientOrPool) {
  return {
    dialect: "postgres",
    async query(text, params = []) {
      return clientOrPool.query(text, params);
    },
    async get(text, ...params) {
      const result = await clientOrPool.query(text, normalizeParams(params));
      return result.rows[0];
    },
    async all(text, ...params) {
      const result = await clientOrPool.query(text, normalizeParams(params));
      return result.rows;
    },
    async run(text, ...params) {
      const result = await clientOrPool.query(text, normalizeParams(params));
      return { rowCount: result.rowCount, rows: result.rows };
    },
    async exec(text) {
      return clientOrPool.query(text);
    },
    async withTransaction(callback) {
      if (!("connect" in clientOrPool)) {
        return callback(createAdapter(clientOrPool));
      }
      const client = await clientOrPool.connect();
      try {
        await client.query("BEGIN");
        const txDb = createAdapter(client);
        const result = await callback(txDb);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}


async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    const alreadyApplied = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE filename = $1",
      [filename]
    );
    if (alreadyApplied.rowCount > 0) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [filename]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

async function seedAdminUsers(db) {
  const adminDefaultPassword =
    process.env.ADMIN_DEFAULT_PASSWORD || (process.env.NODE_ENV === "development" ? "Admin123!" : null);
  if (!adminDefaultPassword) return;

  const adminEmails = ["admin", "admin@epsihl.com", "admin@epsihl.com.co"];
  const passwordHash = await bcrypt.hash(adminDefaultPassword, 10);
  const now = new Date().toISOString();

  for (const adminEmail of adminEmails) {
    await db.run(
      `
        INSERT INTO users (email, password_hash, role, name, status, visible_password, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `,
      adminEmail,
      passwordHash,
      "GERENCIAL",
      "Administrador",
      "ACTIVO",
      adminDefaultPassword,
      now
    );
  }

  await db.run(
    `
      UPDATE users
      SET role = 'GERENCIAL',
          status = 'ACTIVO',
          visible_password = COALESCE(visible_password, $1)
      WHERE email = ANY($2::text[])
    `,
    adminDefaultPassword,
    adminEmails
  );
}

async function importClientesFromCsv(db, csvPath) {
  if (!csvPath || !fs.existsSync(csvPath)) return;
  const countRow = await db.get("SELECT COUNT(*)::int AS total FROM clientes");
  if (countRow?.total > 0) return;

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return;

  const now = new Date().toISOString();
  const [, ...rows] = lines;
  for (const line of rows) {
    const parts = line.split(";");
    if (parts.length < 8) continue;
    const [
      tipoDocumento,
      numeroDocumento,
      dv,
      nombre,
      ciudad,
      direccion,
      telefono,
      email,
    ] = parts.map((part) => part.trim());
    if (!numeroDocumento) continue;
    await db.run(
      `
        INSERT INTO clientes (
          tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (numero_documento) DO NOTHING
      `,
      tipoDocumento || null,
      numeroDocumento,
      dv || null,
      nombre || null,
      ciudad || null,
      direccion || null,
      telefono || null,
      email || null,
      now,
      now
    );
  }
}

async function initializeDatabase() {
  poolInstance = createPgPool();
  await poolInstance.query("SELECT 1");
  await runMigrations(poolInstance);
  dbInstance = createAdapter(poolInstance);
  await seedAdminUsers(dbInstance);
  await importClientesFromCsv(dbInstance, process.env.CLIENTES_CSV_PATH);
  return dbInstance;
}

async function getDb() {
  if (!dbInstance) {
    if (!initPromise) {
      initPromise = initializeDatabase().catch((error) => {
        initPromise = null;
        poolInstance = null;
        dbInstance = null;
        throw error;
      });
    }
    await initPromise;
  }
  return dbInstance;
}

module.exports = {
  getDb,
  getPoolConfig,
  createPgPool,
  runMigrations,
};
