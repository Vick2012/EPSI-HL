const express = require("express");
const { generateRemisionPdf } = require("../services/pdfRemision");
const { validateRemision } = require("../validators/remision");

const router = express.Router();

router.post("/", async (req, res) => {
  const parse = validateRemision(req.body);
  if (!parse.ok) {
    return res.status(400).json({ ok: false, errors: parse.errors });
  }

  try {
    const pdfBuffer = await generateRemisionPdf(parse.data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=remision.pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error generando PDF" });
  }
});

module.exports = router;
