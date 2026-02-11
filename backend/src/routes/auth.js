const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "epsi-hl-secret";

const users = [
  {
    id: "1",
    email: "admin@epsihl.com",
    role: "ADMIN",
    passwordHash: bcrypt.hashSync("Admin123!", 10),
  },
  {
    id: "2",
    email: "admin@epsihl.com.co",
    role: "ADMIN",
    passwordHash: bcrypt.hashSync("Admin123!", 10),
  },
];

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

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return res.status(400).json({ ok: false, message: "Email y contraseña requeridos" });
  }
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }
  const token = signToken(user);
  return res.json({ ok: true, token, role: user.role, email: user.email });
});

router.get("/me", authMiddleware, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

module.exports = {
  authRouter: router,
  authMiddleware,
};
