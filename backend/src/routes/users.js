const express = require("express");
const bcrypt = require("bcrypt");
const { getDb } = require("../db");
const { authMiddleware, requireAnyRole } = require("./auth");
const { validateUserCreate, validateUserUpdate } = require("../validators/users");

const router = express.Router();

const USER_MANAGEMENT_ROLES = ["GERENCIAL", "DIRECCION", "SUPERVISION"];

router.get("/", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (_req, res) => {
  const db = await getDb();
  const users = await db.all("SELECT id, email, role, name, created_at FROM users ORDER BY id DESC");
  return res.json({ ok: true, users });
});

router.post("/", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (req, res) => {
  const parse = validateUserCreate(req.body || {});
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }
  const normalizedEmail = parse.data.email.trim().toLowerCase();
  const normalizedRole = parse.data.role.toUpperCase();
  const db = await getDb();
  const existing = await db.get("SELECT id FROM users WHERE email = ?", normalizedEmail);
  if (existing) {
    return res.status(409).json({ ok: false, message: "El usuario ya existe" });
  }
  const passwordHash = await bcrypt.hash(parse.data.password, 10);
  await db.run(
    "INSERT INTO users (email, password_hash, role, name, created_at) VALUES (?, ?, ?, ?, ?)",
    normalizedEmail,
    passwordHash,
    normalizedRole,
    String(parse.data.name || "").trim(),
    new Date().toISOString()
  );
  return res.json({ ok: true });
});

router.put("/:id", authMiddleware, requireAnyRole(USER_MANAGEMENT_ROLES), async (req, res) => {
  const { id } = req.params;
  const parse = validateUserUpdate(req.body || {});
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }
  const { email, role, name, password } = parse.data;
  if (!email && !role && !name && !password) {
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
    "UPDATE users SET email = COALESCE(?, email), role = COALESCE(?, role), name = COALESCE(?, name), password_hash = COALESCE(?, password_hash) WHERE id = ?",
    email ? String(email).trim().toLowerCase() : null,
    role ? String(role).toUpperCase() : null,
    name || null,
    passwordHash || null,
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
  const tempPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await db.run("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, id);
  return res.json({ ok: true, tempPassword });
});

module.exports = router;
