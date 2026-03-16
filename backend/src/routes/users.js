const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { getDb } = require("../db");
const { authMiddleware, requireAnyRole } = require("./auth");
const { validateUserCreate, validateUserUpdate } = require("../validators/users");

const router = express.Router();

const USER_MANAGEMENT_ROLES = ["GERENCIAL", "DIRECCION"];
const USER_ACTIVE_STATUS = "ACTIVO";

function generateReadablePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(10), (byte) => alphabet[byte % alphabet.length]).join("");
}

router.get("/", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (_req, res) => {
  const db = await getDb();
  const users = await db.all(
    "SELECT id, email, role, name, status, visible_password, created_at FROM users ORDER BY CASE WHEN status = 'ACTIVO' THEN 0 ELSE 1 END, id DESC"
  );
  return res.json({ ok: true, users });
});

router.post("/", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (req, res) => {
  const parse = validateUserCreate(req.body || {});
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }
  const normalizedEmail = parse.data.email.trim().toLowerCase();
  const normalizedRole = parse.data.role.toUpperCase();
  const normalizedStatus = (parse.data.status || USER_ACTIVE_STATUS).toUpperCase();
  const db = await getDb();
  const existing = await db.get("SELECT id FROM users WHERE email = ?", normalizedEmail);
  if (existing) {
    return res.status(409).json({ ok: false, message: "El usuario ya existe" });
  }
  const generatedPassword = generateReadablePassword();
  const passwordHash = await bcrypt.hash(generatedPassword, 10);
  await db.run(
    "INSERT INTO users (email, password_hash, role, name, status, visible_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    normalizedEmail,
    passwordHash,
    normalizedRole,
    String(parse.data.name || "").trim(),
    normalizedStatus,
    generatedPassword,
    new Date().toISOString()
  );
  return res.json({ ok: true, generatedPassword });
});

router.put("/:id", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (req, res) => {
  const { id } = req.params;
  const parse = validateUserUpdate(req.body || {});
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }
  const { email, role, name, password, status } = parse.data;
  if (!email && !role && !name && !password && !status) {
    return res.status(400).json({ ok: false, message: "Sin cambios para actualizar" });
  }
  const db = await getDb();
  const user = await db.get("SELECT id FROM users WHERE id = ?", id);
  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  }
  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.get("SELECT id FROM users WHERE email = ?", normalizedEmail);
    if (existing && String(existing.id) !== String(id)) {
      return res.status(409).json({ ok: false, message: "El email ya está en uso" });
    }
  }
  let passwordHash;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }
  await db.run(
    "UPDATE users SET email = COALESCE(?, email), role = COALESCE(?, role), name = COALESCE(?, name), status = COALESCE(?, status), password_hash = COALESCE(?, password_hash), visible_password = COALESCE(?, visible_password) WHERE id = ?",
    email ? String(email).trim().toLowerCase() : null,
    role ? String(role).toUpperCase() : null,
    name || null,
    status ? String(status).toUpperCase() : null,
    passwordHash || null,
    password || null,
    id
  );
  return res.json({ ok: true });
});

router.delete("/:id", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const user = await db.get("SELECT id FROM users WHERE id = ?", id);
  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  }
  await db.run("DELETE FROM users WHERE id = ?", id);
  return res.json({ ok: true });
});

router.post("/:id/reset", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const user = await db.get("SELECT id, email FROM users WHERE id = ?", id);
  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  }
  const tempPassword = generateReadablePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await db.run("UPDATE users SET password_hash = ?, visible_password = ? WHERE id = ?", passwordHash, tempPassword, id);
  return res.json({ ok: true, tempPassword });
});

module.exports = router;
