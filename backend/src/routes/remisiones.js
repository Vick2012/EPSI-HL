const express = require("express");
const { generateRemisionPdf } = require("../services/pdfRemision");
const { validateRemision } = require("../validators/remision");
const { authMiddleware } = require("./auth");
const { getDb } = require("../db");
const path = require("node:path");
const fs = require("node:fs");
const { validateLookupKey } = require("../utils/input-guards");

const router = express.Router();
const PDF_OUTPUT_DIR =
  process.env.PDF_OUTPUT_DIR || path.join(process.cwd(), "remisiones-pdf");

function buildPdfFilename(numero) {
  const normalizedNumero = String(numero).replace(/^RM[\s_-]*/i, "").trim();
  const safeNumero = normalizedNumero.replaceAll(/[^\w-]+/g, "_") || "000";
  return `Remision_RM_${safeNumero}.pdf`;
}

router.get("/siguiente-numero", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const row = await db.get(`
      SELECT COALESCE(
        MAX(NULLIF(regexp_replace(numero, '\\D', '', 'g'), '')::integer),
        0
      ) + 1 AS siguiente
      FROM remisiones
    `);
    return res.json({ ok: true, siguiente: row?.siguiente || 1 });
  } catch (err) { // NOSONAR - Excepción manejada
    if (process.env.NODE_ENV === "development") {
      console.error("siguiente-numero:", err);
    }
    return res.status(500).json({ ok: false, message: "Error obteniendo siguiente número." });
  }
});

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
    const existing = await db.get("SELECT id FROM remisiones WHERE numero = $1", data.numero);
    if (existing) {
      return res.status(409).json({ ok: false, message: "La remisión ya existe." });
    }
    const now = new Date().toISOString();
    await db.run(
      "INSERT INTO remisiones (numero, data_json, usuario, anulada, created_at, updated_at) VALUES ($1, $2::jsonb, $3, $4, $5, $6)",
      data.numero,
      JSON.stringify(data),
      data.usuario,
      Boolean(data.anulada),
      now,
      now
    );
    const pdfBuffer = await generateRemisionPdf(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${buildPdfFilename(data.numero)}"`);
    return res.send(pdfBuffer);
  } catch (_err) { // NOSONAR - Excepción manejada con console.error
    console.error("POST remisiones PDF:", _err);
    return res.status(500).json({ ok: false, message: "Error generando PDF" });
  }
});

router.get("/:numero", authMiddleware, async (req, res) => {
  if (req.user?.role !== "GERENCIAL") {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede consultar." });
  }
  const numeroResult = validateLookupKey(req.params.numero, "Número de remisión");
  if (!numeroResult.ok) {
    return res.status(400).json({ ok: false, message: numeroResult.message });
  }
  const db = await getDb();
  const record = await db.get("SELECT data_json, anulada FROM remisiones WHERE numero = $1", numeroResult.value);
  if (!record) {
    return res.status(404).json({ ok: false, message: "Remisión no encontrada." });
  }
  try {
    const data = typeof record.data_json === "string" ? JSON.parse(record.data_json) : record.data_json;
    data.anulada = Boolean(record.anulada);
    return res.json({ ok: true, remision: data });
  } catch (_err) { // NOSONAR - Excepción manejada con console.error
    console.error("GET remision JSON:", _err);
    return res.status(500).json({ ok: false, message: "Error leyendo remisión." });
  }
});

router.get("/:numero/pdf", authMiddleware, async (req, res) => {
  if (req.user?.role !== "GERENCIAL") {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede generar PDF." });
  }
  const numeroResult = validateLookupKey(req.params.numero, "Número de remisión");
  if (!numeroResult.ok) {
    return res.status(400).json({ ok: false, message: numeroResult.message });
  }
  const db = await getDb();
  const record = await db.get("SELECT data_json, anulada FROM remisiones WHERE numero = $1", numeroResult.value);
  if (!record) {
    return res.status(404).json({ ok: false, message: "Remisión no encontrada." });
  }
  try {
    const data = typeof record.data_json === "string" ? JSON.parse(record.data_json) : record.data_json;
    data.anulada = Boolean(record.anulada);
    const pdfBuffer = await generateRemisionPdf(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${buildPdfFilename(data.numero)}"`);
    return res.send(pdfBuffer);
  } catch (_err) { // NOSONAR - Excepción manejada con console.error
    console.error("GET remision PDF:", _err);
    return res.status(500).json({ ok: false, message: "Error generando PDF" });
  }
});

router.put("/:numero", authMiddleware, async (req, res) => {
  if (req.user?.role !== "GERENCIAL") {
    return res.status(403).json({ ok: false, message: "Solo GERENCIAL puede editar." });
  }
  const numeroResult = validateLookupKey(req.params.numero, "Número de remisión");
  if (!numeroResult.ok) {
    return res.status(400).json({ ok: false, message: numeroResult.message });
  }
  const { value: numero } = numeroResult;
  const parse = validateRemision(req.body);
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }
  const db = await getDb();
  const existing = await db.get("SELECT id FROM remisiones WHERE numero = $1", numero);
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
    "UPDATE remisiones SET data_json = $1::jsonb, usuario = $2, anulada = $3, updated_at = $4 WHERE numero = $5",
    JSON.stringify(data),
    data.usuario,
    Boolean(data.anulada),
    now,
    numero
  );
  return res.json({ ok: true });
});

module.exports = router;
