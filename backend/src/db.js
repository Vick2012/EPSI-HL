const path = require("node:path");
const fs = require("node:fs");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");
const DATA_DIR = path.join(__dirname, "..", "data");
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, "iris.db");

let dbInstance;
let poolInstance;
let sqliteInstance;
let initPromise;

function shouldUsePostgres() {
  return Boolean(
    process.env.DATABASE_URL
    || process.env.PGHOST
    || process.env.PGPORT
    || process.env.PGUSER
    || process.env.PGDATABASE
  );
}

function getPoolConfig() {
  const useSsl = process.env.PGSSL === "1";
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "epsi_hl",
    ssl: useSsl ? { rejectUnauthorized: false } : false,
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

function transformSqliteSql(text) {
  return String(text)
    .replace(/\$\d+/g, "?")
    .replace(/::jsonb/g, "")
    .replace(/::text\[\]/g, "")
    .replace(/::integer/g, "")
    .replace(/TRUE/g, "1")
    .replace(/FALSE/g, "0");
}

function createSqliteAdapter(db) {
  return {
    dialect: "sqlite",
    async get(text, ...params) {
      return db.get(transformSqliteSql(text), ...normalizeParams(params));
    },
    async all(text, ...params) {
      return db.all(transformSqliteSql(text), ...normalizeParams(params));
    },
    async run(text, ...params) {
      const result = await db.run(transformSqliteSql(text), ...normalizeParams(params));
      return { rowCount: result?.changes || 0 };
    },
    async exec(text) {
      return db.exec(transformSqliteSql(text));
    },
    async withTransaction(callback) {
      await db.exec("BEGIN");
      try {
        const result = await callback(createSqliteAdapter(db));
        await db.exec("COMMIT");
        return result;
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
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
  if (db.dialect === "sqlite") {
    for (const adminEmail of adminEmails) {
      const existing = await db.get("SELECT id FROM users WHERE email = $1", adminEmail);
      if (!existing) {
        const passwordHash = await bcrypt.hash(adminDefaultPassword, 10);
        await db.run(
          "INSERT INTO users (email, password_hash, role, name, status, visible_password, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          adminEmail,
          passwordHash,
          "GERENCIAL",
          "Administrador",
          "ACTIVO",
          adminDefaultPassword,
          new Date().toISOString()
        );
      }
    }
    await db.run(
      "UPDATE users SET role = 'GERENCIAL' WHERE email IN ('admin', 'admin@epsihl.com', 'admin@epsihl.com.co')"
    );
    await db.run(
      "UPDATE users SET status = 'ACTIVO', visible_password = COALESCE(visible_password, $1) WHERE email IN ('admin', 'admin@epsihl.com', 'admin@epsihl.com.co')",
      adminDefaultPassword
    );
    return;
  }

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
  const countRow = db.dialect === "sqlite"
    ? await db.get("SELECT COUNT(*) AS total FROM clientes")
    : await db.get("SELECT COUNT(*)::int AS total FROM clientes");
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
      db.dialect === "sqlite"
        ? "INSERT OR IGNORE INTO clientes (tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
        : `
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

async function initLegacySqlite(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVO',
      visible_password TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const userColumns = await db.all("PRAGMA table_info(users)");
  const hasStatusColumn = userColumns.some((column) => column.name === "status");
  const hasVisiblePasswordColumn = userColumns.some((column) => column.name === "visible_password");

  if (!hasStatusColumn) {
    await db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVO'");
  }
  if (!hasVisiblePasswordColumn) {
    await db.exec("ALTER TABLE users ADD COLUMN visible_password TEXT");
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS remisiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL,
      data_json TEXT NOT NULL,
      usuario TEXT,
      anulada INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_documento TEXT,
      numero_documento TEXT UNIQUE NOT NULL,
      dv TEXT,
      nombre TEXT,
      ciudad TEXT,
      direccion TEXT,
      telefono TEXT,
      email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

async function initializeSqliteDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  sqliteInstance = await open({
    filename: SQLITE_DB_PATH,
    driver: sqlite3.Database,
  });
  await initLegacySqlite(sqliteInstance);
  dbInstance = createSqliteAdapter(sqliteInstance);
  await seedAdminUsers(dbInstance);
  await importClientesFromCsv(dbInstance, process.env.CLIENTES_CSV_PATH);
  return dbInstance;
}

async function initializeDatabase() {
  if (!shouldUsePostgres()) {
    return initializeSqliteDatabase();
  }
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

async function closeDb() {
  dbInstance = null;
  initPromise = null;
  if (sqliteInstance) {
    const currentSqlite = sqliteInstance;
    sqliteInstance = null;
    await currentSqlite.close();
  }
  if (poolInstance) {
    const currentPool = poolInstance;
    poolInstance = null;
    await currentPool.end();
  }
}

module.exports = {
  getDb,
  closeDb,
  getPoolConfig,
  createPgPool,
  runMigrations,
};
