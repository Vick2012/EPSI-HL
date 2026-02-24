const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "iris.db");

let dbInstance;

async function initDb(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL
    );
  `);

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

  const adminDefaultPassword =
    process.env.ADMIN_DEFAULT_PASSWORD || (process.env.NODE_ENV === "development" ? "Admin123!" : null);
  if (adminDefaultPassword) {
    const adminEmails = ["admin@epsihl.com", "admin@epsihl.com.co"];
    for (const adminEmail of adminEmails) {
      const existing = await db.get("SELECT id FROM users WHERE email = ?", adminEmail);
      if (!existing) {
        const passwordHash = await bcrypt.hash(adminDefaultPassword, 10);
        await db.run(
          "INSERT INTO users (email, password_hash, role, name, created_at) VALUES (?, ?, ?, ?, ?)",
          adminEmail,
          passwordHash,
          "GERENCIAL",
          "Gerencia",
          new Date().toISOString()
        );
      }
    }
    await db.run(
      "UPDATE users SET role = 'GERENCIAL' WHERE email IN ('admin@epsihl.com', 'admin@epsihl.com.co')"
    );
  }
}

async function importClientesFromCsv(db, csvPath) {
  if (!csvPath || !fs.existsSync(csvPath)) return;
  const countRow = await db.get("SELECT COUNT(*) as total FROM clientes");
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
    ] = parts.map((p) => p.trim());
    if (!numeroDocumento) continue;
    await db.run(
      "INSERT OR IGNORE INTO clientes (tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

async function getDb() {
  if (!dbInstance) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbInstance = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    await initDb(dbInstance);
    await importClientesFromCsv(dbInstance, process.env.CLIENTES_CSV_PATH);
  }
  return dbInstance;
}

module.exports = {
  getDb,
};
