const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const ASSETS_DIR = path.join(__dirname, "..", "..", "assets");
const LOGO_PATH = path.join(ASSETS_DIR, "epsi-hl-logo.png");

const PAGE_WIDTH = 612; // 8.5in
const PAGE_HEIGHT = 792; // 11in
const MARGIN = 32;

const COLORS = {
  blue: "#1f3f83",
  lightBlue: "#e6edf8",
  gray: "#5c6b85",
  black: "#0f172a",
  red: "#b3202d",
  orange: "#f19a3e",
};

function drawBox(doc, x, y, w, h) {
  doc.rect(x, y, w, h).stroke(COLORS.blue);
}

function drawWatermark(doc, text) {
  const centerX = PAGE_WIDTH / 2;
  const centerY = PAGE_HEIGHT / 2;
  doc.save();
  doc.opacity(0.18);
  doc.fillColor(COLORS.red).fontSize(120);
  doc.rotate(-35, { origin: [centerX, centerY] });
  doc.text(text, centerX - PAGE_WIDTH, centerY - 60, {
    width: PAGE_WIDTH * 2,
    align: "center",
  });
  doc.restore();
  doc.opacity(1);
}

function drawHeader(doc, remision, logoPath) {
  const left = MARGIN;
  const top = MARGIN;
  const rightX = PAGE_WIDTH - 220;

  let logoDrawn = false;
  if (logoPath) {
    try {
      doc.image(logoPath, left, top - 2, { width: 120 });
      logoDrawn = true;
    } catch (error) {
      logoDrawn = false;
    }
  }
  if (!logoDrawn) {
    doc
      .fontSize(11)
      .fillColor(COLORS.blue)
      .text("EPSI HL S.A.S", left + 4, top + 10, { width: 110 });
  }

  const headerTextX = left + 140;
  const headerTextY = top + 4;
  const headerTextWidth = Math.max(200, rightX - headerTextX - 10);
  doc.fontSize(7.2).fillColor(COLORS.blue);
  const headerLines = [
    "EMPRESA PRESTADORA DE SERVICIOS INTEGRALES HL S.A.S",
    "NIT 900950697 - 3",
    "Calle 2 # 18-93 Parque Industrial San Jorge Oficina 276",
    "Mosquera - Cundinamarca",
    "313 402 4369 / 314 280 1035",
    "facturacion@epsihl.com.co",
  ];
  doc.text(headerLines.join("\n"), headerTextX, headerTextY, {
    width: headerTextWidth,
    lineGap: 4,
  });

  drawBox(doc, rightX, top + 24, 180, 40);
  doc
    .fontSize(10)
    .fillColor(COLORS.gray)
    .text("N° DE REMISION", rightX, top + 28, { align: "center", width: 180 });
  doc
    .fontSize(16)
    .fillColor(COLORS.red)
    .text(`${remision.numero}`, rightX, top + 45, {
      align: "center",
      width: 180,
    });

  drawBox(doc, rightX, top + 70, 180, 36);
  doc
    .fontSize(9)
    .fillColor(COLORS.gray)
    .text("FECHA", rightX, top + 72, { align: "center", width: 180 });

  const fecha = new Date(remision.fecha);
  const day = `${fecha.getDate()}`.padStart(2, "0");
  const month = `${fecha.getMonth() + 1}`.padStart(2, "0");
  const year = `${fecha.getFullYear()}`;

  const cellY = top + 84;
  const cellH = 22;
  drawBox(doc, rightX, cellY, 60, cellH);
  drawBox(doc, rightX + 60, cellY, 60, cellH);
  drawBox(doc, rightX + 120, cellY, 60, cellH);
  doc.fontSize(9).fillColor(COLORS.black);
  const textY = cellY + (cellH - 9) / 2;
  doc.text(day, rightX, textY, { align: "center", width: 60 });
  doc.text(month, rightX + 60, textY, { align: "center", width: 60 });
  doc.text(year, rightX + 120, textY, { align: "center", width: 60 });
}

function drawCliente(doc, remision) {
  const startY = 140;
  const left = MARGIN;
  const width = PAGE_WIDTH - MARGIN * 2;

  drawBox(doc, left, startY, width, 90);
  doc
    .rect(left, startY, width, 16)
    .fill(COLORS.blue)
    .stroke(COLORS.blue);
  doc
    .fontSize(9)
    .fillColor("white")
    .text("CLIENTE", left, startY + 3, { align: "center", width });

  doc.fillColor(COLORS.black).fontSize(9);
  const labels = [
    ["C.C./NIT:", remision.cliente.nit],
    ["NOMBRE/RAZON SOCIAL:", remision.cliente.nombre],
    ["DIRECCION:", remision.cliente.direccion],
    ["CIUDAD:", remision.cliente.ciudad || ""],
    ["TELEFONO:", remision.cliente.telefono || ""],
  ];

  const rowTop = startY + 16;
  const rowHeight = 14;
  for (let i = 1; i < labels.length; i += 1) {
    const lineY = rowTop + i * rowHeight;
    doc.moveTo(left, lineY).lineTo(left + width, lineY).stroke(COLORS.blue);
  }

  let y = startY + 20;
  labels.forEach(([label, value]) => {
    doc.text(label, left + 6, y + 2);
    doc.text(value, left + 170, y + 2, { width: 360 });
    y += rowHeight;
  });
}

function drawItems(doc, remision) {
  const left = MARGIN;
  const top = 240;
  const width = PAGE_WIDTH - MARGIN * 2;
  const rowHeight = 20;
  const rows = Math.max(remision.items.length, 1);
  const height = 20 + rowHeight * rows;

  drawBox(doc, left, top, width, height);

  const columns = {
    cantidad: 70,
    descripcion: width - 70 - 110 - 110,
    unitario: 110,
    total: 110,
  };

  doc
    .rect(left, top, width, 16)
    .fill(COLORS.blue)
    .stroke(COLORS.blue);
  doc.fillColor("white").fontSize(9);
  doc.text("CANTIDAD", left, top + 3, { width: columns.cantidad, align: "center" });
  doc.text("DESCRIPCION", left + columns.cantidad, top + 3, {
    width: columns.descripcion,
    align: "center",
  });
  doc.text("PRECIO UNITARIO", left + columns.cantidad + columns.descripcion, top + 3, {
    width: columns.unitario,
    align: "center",
  });
  doc.text("PRECIO TOTAL", left + columns.cantidad + columns.descripcion + columns.unitario, top + 3, {
    width: columns.total,
    align: "center",
  });

  const rowY = top + 20;
  for (let i = 1; i < rows; i += 1) {
    const y = rowY + i * rowHeight;
    doc.moveTo(left, y).lineTo(left + width, y).stroke(COLORS.blue);
  }

  doc.moveTo(left + columns.cantidad, top).lineTo(left + columns.cantidad, top + height).stroke(COLORS.blue);
  doc
    .moveTo(left + columns.cantidad + columns.descripcion, top)
    .lineTo(left + columns.cantidad + columns.descripcion, top + height)
    .stroke(COLORS.blue);
  doc
    .moveTo(left + columns.cantidad + columns.descripcion + columns.unitario, top)
    .lineTo(left + columns.cantidad + columns.descripcion + columns.unitario, top + height)
    .stroke(COLORS.blue);

  doc.fontSize(9).fillColor(COLORS.black);
  remision.items.forEach((item, index) => {
    const y = rowY + index * rowHeight + 4;
    doc.text(String(item.cantidad), left + 4, y, { width: columns.cantidad - 8 });
    doc.text(item.descripcion, left + columns.cantidad + 4, y, {
      width: columns.descripcion - 8,
    });
    doc.text(formatCurrency(item.valorUnitario), left + columns.cantidad + columns.descripcion + 4, y, {
      width: columns.unitario - 8,
      align: "right",
    });
    doc.text(formatCurrency(item.subtotal), left + columns.cantidad + columns.descripcion + columns.unitario + 4, y, {
      width: columns.total - 8,
      align: "right",
    });
  });
}

function drawPagoFirma(doc, remision, logoPath) {
  const left = MARGIN;
  const top = 430;

  drawBox(doc, left, top, 330, 60);
  doc
    .fontSize(9)
    .fillColor(COLORS.blue)
    .text("MEDIO DE PAGO:", left + 6, top + 6);

  const opciones = [
    { label: "Efectivo", key: "efectivo" },
    { label: "Efectivo - Nequi", key: "nequi" },
    { label: "Transferencia - BanColombia", key: "bancolombia" },
  ];
  const optionsLeft = left + 110;
  const optionWidth = 160;
  const checkWidth = 30;
  const rowHeight = 14;
  const rowGap = 2;
  const blockHeight = rowHeight * opciones.length + rowGap * (opciones.length - 1);
  let y = top + (60 - blockHeight) / 2;
  opciones.forEach((opt) => {
    drawBox(doc, optionsLeft, y - 2, optionWidth, rowHeight);
    drawBox(doc, optionsLeft + optionWidth, y - 2, checkWidth, rowHeight);
    const marcado = remision.metodoPago.toLowerCase() === opt.key;
    const textY = y + 3;
    doc.fillColor(COLORS.black).text(opt.label, optionsLeft + 6, textY, {
      width: optionWidth - 12,
    });
    doc.text(marcado ? "X" : "", optionsLeft + optionWidth, textY, {
      width: checkWidth,
      align: "center",
    });
    y += rowHeight + rowGap;
  });

  drawBox(doc, left, top + 70, 330, 60);
  doc
    .fontSize(9)
    .fillColor(COLORS.blue)
    .text("RECIBE CONFORME:", left + 6, top + 76);
  doc.moveTo(left + 90, top + 110).lineTo(left + 300, top + 110).stroke(COLORS.blue);
  doc
    .fontSize(8)
    .fillColor(COLORS.gray)
    .text("Recibe Conforme", left + 110, top + 114);

  // Marca de agua deshabilitada por solicitud
}

function drawTotales(doc, remision) {
  const left = PAGE_WIDTH - MARGIN - 180;
  const top = 470;
  drawBox(doc, left, top, 180, 70);
  const rows = [
    ["Sub - Total", formatCurrency(remision.subtotal)],
    [`IVA (${remision.ivaPorcentaje} %)`, formatCurrency(remision.iva)],
    ["Total", formatCurrency(remision.total)],
  ];
  let y = top + 6;
  rows.forEach(([label, value], index) => {
    doc.fontSize(9).fillColor(COLORS.black);
    doc.text(label, left + 8, y, { width: 90 });
    doc.text(value, left + 100, y, { width: 70, align: "right" });
    if (index < rows.length - 1) {
      doc.moveTo(left, y + 16).lineTo(left + 180, y + 16).stroke(COLORS.blue);
    }
    y += 20;
  });
}

function drawFooter(doc, remision) {
  const footerY = PAGE_HEIGHT - MARGIN - 16;
  const fecha = new Date(remision.fecha);
  const date = `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}`;
  const time = `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
  doc
    .fontSize(8)
    .fillColor(COLORS.gray)
    .text(`Usuario: ${remision.usuario || ""}`, MARGIN, footerY, { align: "left", width: PAGE_WIDTH - MARGIN * 2 });
  doc
    .fontSize(8)
    .fillColor(COLORS.gray)
    .text(`${date} ${time}`, MARGIN, footerY, { align: "right", width: PAGE_WIDTH - MARGIN * 2 });
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return `$ ${number.toLocaleString("es-CO")}`;
}

async function getLogoPath() {
  if (!fs.existsSync(LOGO_PATH)) {
    return null;
  }

  try {
    const outputPath = path.join(ASSETS_DIR, "epsi-hl-logo-render.png");
    await sharp(LOGO_PATH)
      .resize({ width: 120 })
      .flatten({ background: "#ffffff" })
      .png()
      .toFile(outputPath);
    return outputPath;
  } catch (error) {
    return LOGO_PATH;
  }
}

async function generateRemisionPdf(remision) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: MARGIN });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    getLogoPath()
      .then((logoPath) => {
        drawHeader(doc, remision, logoPath);
        drawCliente(doc, remision);
        drawItems(doc, remision);
        drawPagoFirma(doc, remision, logoPath);
        drawTotales(doc, remision);
        drawFooter(doc, remision);
        if (remision.anulada) {
          drawWatermark(doc, "ANULADA");
        }
        doc.end();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  generateRemisionPdf,
};
