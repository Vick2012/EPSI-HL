const express = require("express");
const fs = require("fs");
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
  const existing = await db.get("SELECT id FROM clientes WHERE numero_documento = ?", numero);
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
  if (!existing) {
    const csvPath = process.env.CLIENTES_CSV_PATH;
    if (csvPath) {
      if (!fs.existsSync(csvPath)) {
        const header =
          "TIPO DE DOCUMENTO;NUMERO DE DOCUMENTO;DIGITO DE VERIFICACION;NOMBRE O RAZON SOCIAL;CIUDAD;DIRECCION;TELEFONO;CORREO ELECTRONICO\n";
        fs.writeFileSync(csvPath, header);
      }
      const line = [
        payload.tipo_documento || "",
        numero,
        payload.dv || "",
        payload.nombre || "",
        payload.ciudad || "",
        payload.direccion || "",
        payload.telefono || "",
        payload.email || "",
      ]
        .map((value) => String(value).replace(/[\r\n]+/g, " "))
        .join(";");
      fs.appendFileSync(csvPath, `${line}\n`);
    }
  }
  return res.json({ ok: true });
});

module.exports = router;
