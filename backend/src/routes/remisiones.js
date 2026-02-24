const express = require("express");
const { generateRemisionPdf } = require("../services/pdfRemision");
const { validateRemision } = require("../validators/remision");
const { authMiddleware } = require("./auth");
const { getDb } = require("../db");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const PDF_OUTPUT_DIR = process.env.PDF_OUTPUT_DIR || "C:\\Users\\USER\\Desktop\\Remisiones PDF";

router.post("/", authMiddleware, async (req, res) => {
  const canAnular = req.user?.role === "GERENCIAL";
  if (!canAnular && req.body?.anulada) {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede anular." });
  }
  const parse = validateRemision(req.body);
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }

  try {
    const data = {
      ...parse.data,
      usuario: req.user?.email || "usuario",
    };
    const db = await getDb();
    const existing = await db.get("SELECT id FROM remisiones WHERE numero = ?", data.numero);
    if (existing) {
      return res.status(409).json({ ok: false, message: "La remisión ya existe." });
    }
    const now = new Date().toISOString();
    await db.run(
      "INSERT INTO remisiones (numero, data_json, usuario, anulada, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      data.numero,
      JSON.stringify(data),
      data.usuario,
      data.anulada ? 1 : 0,
      now,
      now
    );
    const pdfBuffer = await generateRemisionPdf(data);
    if (!fs.existsSync(PDF_OUTPUT_DIR)) {
      fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
    }
    const safeNumero = String(data.numero).replace(/[^\w\-]+/g, "_");
    const pdfPath = path.join(PDF_OUTPUT_DIR, `remision_${safeNumero}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=remision.pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error generando PDF" });
  }
});

router.get("/:numero", authMiddleware, async (req, res) => {
  if (req.user?.role !== "GERENCIAL") {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede consultar." });
  }
  const { numero } = req.params;
  const db = await getDb();
  const record = await db.get("SELECT data_json FROM remisiones WHERE numero = ?", numero);
  if (!record) {
    return res.status(404).json({ ok: false, message: "Remisión no encontrada." });
  }
  try {
    const data = JSON.parse(record.data_json);
    return res.json({ ok: true, remision: data });
  } catch {
    return res.status(500).json({ ok: false, message: "Error leyendo remisión." });
  }
});

router.get("/:numero/pdf", authMiddleware, async (req, res) => {
  if (req.user?.role !== "GERENCIAL") {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede generar PDF." });
  }
  const { numero } = req.params;
  const db = await getDb();
  const record = await db.get("SELECT data_json FROM remisiones WHERE numero = ?", numero);
  if (!record) {
    return res.status(404).json({ ok: false, message: "Remisión no encontrada." });
  }
  try {
    const data = JSON.parse(record.data_json);
    const pdfBuffer = await generateRemisionPdf(data);
    if (!fs.existsSync(PDF_OUTPUT_DIR)) {
      fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
    }
    const safeNumero = String(data.numero).replace(/[^\w\-]+/g, "_");
    const pdfPath = path.join(PDF_OUTPUT_DIR, `remision_${safeNumero}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=remision.pdf");
    return res.send(pdfBuffer);
  } catch {
    return res.status(500).json({ ok: false, message: "Error generando PDF" });
  }
});

router.put("/:numero", authMiddleware, async (req, res) => {
  if (req.user?.role !== "GERENCIAL") {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede editar." });
  }
  const { numero } = req.params;
  const parse = validateRemision(req.body);
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }
  const db = await getDb();
  const existing = await db.get("SELECT id FROM remisiones WHERE numero = ?", numero);
  if (!existing) {
    return res.status(404).json({ ok: false, message: "Remisión no encontrada." });
  }
  const data = {
    ...parse.data,
    numero,
    usuario: req.user?.email || "usuario",
  };
  const now = new Date().toISOString();
  await db.run(
    "UPDATE remisiones SET data_json = ?, usuario = ?, anulada = ?, updated_at = ? WHERE numero = ?",
    JSON.stringify(data),
    data.usuario,
    data.anulada ? 1 : 0,
    now,
    numero
  );
  return res.json({ ok: true });
});

module.exports = router;
