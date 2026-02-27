const express = require("express");
const fs = require("fs");
const xlsx = require("xlsx");
const { getDb } = require("../db");
const { authMiddleware } = require("./auth");

const router = express.Router();

const handleExport = async (req, res) => {
  if (req.user?.role !== "GERENCIAL") {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede exportar." });
  }
  const db = await getDb();
  const rows = await db.all(
    "SELECT tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at FROM clientes ORDER BY id DESC"
  );
  const data = rows.map((row) => ({
    "TIPO DE DOCUMENTO": row.tipo_documento || "",
    "NUMERO DE DOCUMENTO": row.numero_documento || "",
    "DIGITO DE VERIFICACION": row.dv || "",
    "NOMBRE O RAZON SOCIAL": row.nombre || "",
    CIUDAD: row.ciudad || "",
    DIRECCION: row.direccion || "",
    TELEFONO: row.telefono || "",
    "CORREO ELECTRONICO": row.email || "",
    "CREADO EN": row.created_at || "",
    "ACTUALIZADO EN": row.updated_at || "",
  }));
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(workbook, worksheet, "Clientes");
  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=clientes_epsihl.xlsx");
  return res.send(buffer);
};

router.get("/export", authMiddleware, handleExport);
router.get("/exportar", authMiddleware, handleExport);

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
