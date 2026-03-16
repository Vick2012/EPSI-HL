const express = require("express");
const xlsx = require("xlsx");
const { getDb } = require("../db");
const { authMiddleware } = require("./auth");
const { validateCliente } = require("../validators/cliente");

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

router.get("/exportar", authMiddleware, handleExport);

router.get("/:numero", authMiddleware, async (req, res) => {
  const { numero } = req.params;
  const db = await getDb();
  const cliente = await db.get("SELECT * FROM clientes WHERE numero_documento = $1", numero);
  if (!cliente) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado." });
  }
  return res.json({ ok: true, cliente });
});

router.post("/", authMiddleware, async (req, res) => {
  const parse = validateCliente(req.body || {});
  if (!parse.ok) {
    return res.status(400).json({ ok: false, message: "Datos de cliente inválidos.", errors: parse.errors });
  }
  const payload = parse.data;
  const numero = payload.numero_documento;
  const now = new Date().toISOString();
  const db = await getDb();
  await db.run(
    `INSERT INTO clientes
      (tipo_documento, numero_documento, dv, nombre, ciudad, direccion, telefono, email, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    now,
  );
  return res.json({ ok: true });
});

module.exports = router;
