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

  const adminEmails = ["admin@epsihl.com", "admin@epsihl.com.co"];
  for (const adminEmail of adminEmails) {
    const existing = await db.get("SELECT id FROM users WHERE email = ?", adminEmail);
    if (!existing) {
      const passwordHash = await bcrypt.hash("Admin123!", 10);
      await db.run(
        "INSERT INTO users (email, password_hash, role, name, created_at) VALUES (?, ?, ?, ?, ?)",
        adminEmail,
        passwordHash,
        "ADMIN",
        "Administrador",
        new Date().toISOString()
      );
    }
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
  }
  return dbInstance;
}

module.exports = {
  getDb,
};
