const express = require("express");
const { getDb } = require("../db");
const { authMiddleware } = require("./auth");

const router = express.Router();

router.get("/:numero", authMiddleware, async (req, res) => {
  const { numero } = req.params;
  const db = await getDb();
  const cliente = await db.get("SELECT * FROM clientes WHERE numero_documento = ?", numero);
  if (!cliente) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado." });
  }
  return res.json({ ok: true, cliente });
});

router.post("/", authMiddleware, async (req, res) => {
  const payload = req.body || {};
  const numero = String(payload.numero_documento || "").trim();
  if (!numero) {
    return res.status(400).json({ ok: false, message: "Número de documento requerido." });
  }
  const now = new Date().toISOString();
  const db = await getDb();
  await db.run(
    `INSERT INTO clientes
      (tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(numero_documento) DO UPDATE SET
        tipo_documento=excluded.tipo_documento,
        dv=excluded.dv,
        nombre=excluded.nombre,
        ciudad=excluded.ciudad,
        direccion=excluded.direccion,
        telefono=excluded.telefono,
        email=excluded.email,
        updated_at=excluded.updated_at
    `,
    payload.tipo_documento || null,
    numero,
    payload.dv || null,
    payload.nombre || null,
    payload.ciudad || null,
    payload.direccion || null,
    payload.telefono || null,
    payload.email || null,
    now,
    now
  );
  return res.json({ ok: true });
});

module.exports = router;
