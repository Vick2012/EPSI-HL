const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getDb } = require("../db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "epsi-hl-secret";

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "8h",
  });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return res.status(401).json({ ok: false, message: "Token requerido" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ ok: false, message: "Acceso denegado" });
    }
    return next();
  };
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return res.status(400).json({ ok: false, message: "Email y contraseña requeridos" });
  }
  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE email = ?", normalizedEmail);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }
  const token = signToken(user);
  return res.json({ ok: true, token, role: user.role, email: user.email, name: user.name });
});

router.get("/me", authMiddleware, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

router.post("/request-reset", async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ ok: false, message: "Email requerido" });
  }
  const db = await getDb();
  const user = await db.get("SELECT id, email FROM users WHERE email = ?", normalizedEmail);
  if (!user) {
    return res.json({ ok: true, message: "Si el correo existe, recibirás un enlace." });
  }
  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.run(
    "INSERT INTO password_resets (user_id, token_hash, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)",
    user.id,
    tokenHash,
    expiresAt,
    new Date().toISOString()
  );

  // Envío por email (configurar SMTP en variables de entorno)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const resetLink = `${process.env.APP_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Recuperación de contraseña - Sistema IRIS",
      text: `Usa este enlace para restablecer tu contraseña: ${resetLink}`,
    });
  }

  // Para entorno de desarrollo devolvemos el token
  return res.json({
    ok: true,
    message: "Si el correo existe, recibirás un enlace.",
    devToken: rawToken,
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ ok: false, message: "Token y contraseña requeridos" });
  }
  const db = await getDb();
  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const record = await db.get(
    "SELECT * FROM password_resets WHERE token_hash = ? AND used = 0",
    tokenHash
  );
  if (!record) {
    return res.status(400).json({ ok: false, message: "Token inválido" });
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ ok: false, message: "Token expirado" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await db.run("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, record.user_id);
  await db.run("UPDATE password_resets SET used = 1 WHERE id = ?", record.id);
  return res.json({ ok: true, message: "Contraseña actualizada" });
});

module.exports = {
  authRouter: router,
  authMiddleware,
  requireRole,
};
