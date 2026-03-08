const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const ASSETS_DIR = path.join(__dirname, "..", "..", "assets");
const HEADER_LOGO_PATHS = [
  process.env.HEADER_LOGO_PATH,
  path.join(ASSETS_DIR, "Logo.png"),
].filter(Boolean);
const WATERMARK_LOGO_PATHS = [
  process.env.WATERMARK_LOGO_PATH,
  path.join(ASSETS_DIR, "Icono.png"),
].filter(Boolean);

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

function textCenteredInRow(doc, text, x, y, height, options = {}) {
  const textHeight = doc.heightOfString(String(text), options);
  const textY = y + Math.max(0, (height - textHeight) / 2);
  doc.text(text, x, textY, options);
}

function drawPageBorder(doc) {
  const inset = 14;
  doc.rect(inset, inset, PAGE_WIDTH - inset * 2, PAGE_HEIGHT - inset * 2).stroke(COLORS.blue);
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

function drawLogoWatermark(doc, logoPath) {
  if (!logoPath) return;
  const centerX = PAGE_WIDTH / 2;
  const centerY = PAGE_HEIGHT / 2;
  const width = 260;
  const height = 260;
  doc.save();
  doc.opacity(0.12);
  try {
    doc.image(logoPath, centerX - width / 2, centerY - height / 2, {
      width,
      height,
    });
  } catch (error) {
    // If logo fails, skip watermark silently.
  }
  doc.restore();
  doc.opacity(1);
}

function drawHeader(doc, remision, logoPath) {
  const left = MARGIN;
  const top = MARGIN;
  const logoOffset = 28; // Logo más abajo
  const blockTop = top + logoOffset;
  const rightBlockOffset = 12; // Tabla remisión/fecha más abajo
  const logoWidth = 140;
  const gap = 48; // Más espacio entre logo y título (evita solapamiento)
  const centerX = left + logoWidth + gap;
  const boxWidth = 138; // Más estrecho para que el nombre quepa en una línea
  const row1H = 28; // Altura sección N° remisión
  const row2H = 42; // Altura sección fecha
  const rightBlockH = row1H + row2H; // Bloque unificado
  const rightX = PAGE_WIDTH - MARGIN - boxWidth - 8; // Más espacio para nombre empresa
  const centerWidth = rightX - centerX - 12;
  const nameWidth = rightX - centerX - 8;
  const rightBlockTop = blockTop + rightBlockOffset;
  const nameTop = top + 12; // Nombre de empresa más arriba (no bajado)

  // --- Logo ---
  let logoDrawn = false;
  if (logoPath) {
    try {
      doc.image(logoPath, left, blockTop, { width: logoWidth });
      logoDrawn = true;
    } catch (error) {
      logoDrawn = false;
    }
  }
  if (!logoDrawn) {
    doc.fontSize(12).fillColor(COLORS.blue);
    doc.text("EPSI HL", left, blockTop + 4, { width: logoWidth - 4 });
    doc.fontSize(8).fillColor(COLORS.blue);
    doc.text("S.A.S", left, blockTop + 16, { width: logoWidth - 4 });
  }

  // --- Razón social: una sola línea, negrita, fuente 8pt para que quepa ---
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.blue);
  doc.text("EMPRESA PRESTADORA DE SERVICIOS INTEGRALES HL S.A.S", centerX, nameTop, {
    align: "left",
    width: nameWidth,
  });
  doc.font("Helvetica"); // Restaurar fuente normal

  // --- Bloque unificado: N° remisión + Fecha (una sola caja, más abajo) ---
  drawBox(doc, rightX, rightBlockTop, boxWidth, rightBlockH);
  doc.strokeColor(COLORS.blue).lineWidth(0.5);
  doc.moveTo(rightX, rightBlockTop + row1H).lineTo(rightX + boxWidth, rightBlockTop + row1H).stroke();
  doc.strokeColor(COLORS.blue).lineWidth(1);

  doc.fontSize(7).fillColor(COLORS.gray);
  doc.text("N° DE REMISION", rightX, rightBlockTop + 2, { align: "center", width: boxWidth });
  doc.fontSize(14).fillColor(COLORS.red);
  doc.text(String(remision.numero || ""), rightX, rightBlockTop + 10, {
    align: "center",
    width: boxWidth,
  });

  const fecha = new Date(remision.fecha);
  const day = `${fecha.getDate()}`.padStart(2, "0");
  const month = `${fecha.getMonth() + 1}`.padStart(2, "0");
  const year = `${fecha.getFullYear()}`;
  doc.fontSize(7).fillColor(COLORS.gray);
  doc.text("FECHA", rightX, rightBlockTop + row1H + 2, { align: "center", width: boxWidth });
  const cellW = boxWidth / 3;
  const cellH = 16;
  const cellY = rightBlockTop + row1H + 12;
  drawBox(doc, rightX, cellY, cellW, cellH);
  drawBox(doc, rightX + cellW, cellY, cellW, cellH);
  drawBox(doc, rightX + cellW * 2, cellY, cellW, cellH);
  doc.fontSize(8).fillColor(COLORS.black);
  const textY = cellY + (cellH - 8) / 2;
  doc.text(day, rightX, textY, { align: "center", width: cellW });
  doc.text(month, rightX + cellW, textY, { align: "center", width: cellW });
  doc.text(year, rightX + cellW * 2, textY, { align: "center", width: cellW });

  // --- Datos de contacto: junto al bloque derecho (no abajo) ---
  const contactTop = blockTop + 16; // Justo debajo del nombre, alineado con bloque derecho
  doc.fontSize(7.5).fillColor(COLORS.gray);
  const contactLines = [
    "NIT 900950697 - 3",
    "Calle 2 # 18-93 Parque Industrial San Jorge Oficina 276",
    "Mosquera - Cundinamarca",
    "313 402 4369 / 314 280 1035",
    "facturacion@epsihl.com.co",
  ];
  const contactHeight = doc.heightOfString(contactLines.join("\n"), { width: centerWidth, lineGap: 2 });
  doc.text(contactLines.join("\n"), centerX, contactTop, {
    width: centerWidth,
    lineGap: 2,
    align: "left",
  });

  // Línea separadora: debajo del bloque derecho y contacto
  const contentBottom = Math.max(contactTop + contactHeight + 4, rightBlockTop + rightBlockH + 4);
  const headerBottom = contentBottom + 6;
  doc.strokeColor(COLORS.blue).lineWidth(0.5);
  doc.moveTo(left, headerBottom).lineTo(PAGE_WIDTH - left, headerBottom).stroke();
  doc.strokeColor(COLORS.blue).lineWidth(1);
}

function drawCliente(doc, remision) {
  const startY = 150;
  const left = MARGIN;
  const width = PAGE_WIDTH - MARGIN * 2;

  const clienteBoxHeight = 106; // Más alto para evitar solapamiento de textos
  drawBox(doc, left, startY, width, clienteBoxHeight);
  doc
    .rect(left, startY, width, 16)
    .fill(COLORS.blue)
    .stroke(COLORS.blue);
  doc
    .fontSize(9)
    .fillColor("white")
    .text("CLIENTE", left, startY + 3, { align: "center", width });

  doc.fillColor(COLORS.black).fontSize(9);
  const nitLabel = remision.cliente.dv
    ? `${remision.cliente.nit}  -  ${remision.cliente.dv}`
    : remision.cliente.nit;
  const rawTipoDocumento =
    remision.cliente.tipoDocumento || remision.cliente.tipo_documento || "";
  const tipoDocumento = String(rawTipoDocumento).trim().toUpperCase();
  const tipoLabelMap = {
    CC: "C.C.",
    "C.C.": "C.C.",
    "C.C": "C.C.",
    CE: "C.E.",
    "C.E.": "C.E.",
    "C.E": "C.E.",
    PAS: "PASAPORTE",
    PASAPORTE: "PASAPORTE",
    PPT: "PPT",
    NIT: "NIT",
    OTRO: "OTRO",
  };
  let tipoLabel = tipoLabelMap[tipoDocumento];
  if (!tipoLabel && tipoDocumento) {
    if (tipoDocumento.includes("CC")) tipoLabel = "C.C.";
    else if (tipoDocumento.includes("CE")) tipoLabel = "C.E.";
    else if (tipoDocumento.includes("PAS")) tipoLabel = "PASAPORTE";
    else if (tipoDocumento.includes("PPT")) tipoLabel = "PPT";
    else if (tipoDocumento.includes("NIT")) tipoLabel = "NIT";
    else tipoLabel = tipoDocumento;
  }
  if (!tipoLabel) tipoLabel = "C.C./NIT";
  const labels = [
    [`${tipoLabel}:`, nitLabel],
    ["NOMBRE/RAZON SOCIAL:", remision.cliente.nombre],
    ["DIRECCION:", remision.cliente.direccion],
    ["CIUDAD:", remision.cliente.ciudad || ""],
    ["TELEFONO:", remision.cliente.telefono || ""],
  ];

  const rowTop = startY + 16;
  const rowHeight = 18; // Más espacio entre filas para evitar solapamiento
  for (let i = 1; i < labels.length; i += 1) {
    const lineY = rowTop + i * rowHeight;
    doc.moveTo(left, lineY).lineTo(left + width, lineY).stroke(COLORS.blue);
  }
  const separatorX = left + 160;
  doc.moveTo(separatorX, rowTop).lineTo(separatorX, startY + clienteBoxHeight).stroke(COLORS.blue);

  let y = rowTop;
  const cellOpts = { align: "left", lineGap: 0 };
  labels.forEach(([label, value]) => {
    textCenteredInRow(doc, label, left + 6, y, rowHeight, { ...cellOpts, width: 150 });
    textCenteredInRow(doc, value, left + 170, y, rowHeight, { ...cellOpts, width: 360 });
    y += rowHeight;
  });
}

function drawItems(doc, remision) {
  const left = MARGIN;
  const clienteEndY = 150 + 106;
  const gapEntreSecciones = 18;
  const top = clienteEndY + gapEntreSecciones;
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
  textCenteredInRow(doc, "CANTIDAD", left, top, 16, { width: columns.cantidad, align: "center" });
  textCenteredInRow(doc, "DESCRIPCION", left + columns.cantidad, top, 16, {
    width: columns.descripcion,
    align: "center",
  });
  textCenteredInRow(doc, "PRECIO UNITARIO", left + columns.cantidad + columns.descripcion, top, 16, {
    width: columns.unitario,
    align: "center",
  });
  textCenteredInRow(
    doc,
    "PRECIO TOTAL",
    left + columns.cantidad + columns.descripcion + columns.unitario,
    top,
    16,
    {
      width: columns.total,
      align: "center",
    },
  );

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
    const y = rowY + index * rowHeight;
    textCenteredInRow(doc, String(item.cantidad), left + 4, y, rowHeight, {
      width: columns.cantidad - 8,
    });
    textCenteredInRow(doc, item.descripcion, left + columns.cantidad + 4, y, rowHeight, {
      width: columns.descripcion - 8,
    });
    textCenteredInRow(
      doc,
      formatCurrency(item.valorUnitario),
      left + columns.cantidad + columns.descripcion + 4,
      y,
      rowHeight,
      {
        width: columns.unitario - 8,
        align: "right",
      },
    );
    textCenteredInRow(
      doc,
      formatCurrency(item.subtotal),
      left + columns.cantidad + columns.descripcion + columns.unitario + 4,
      y,
      rowHeight,
      {
        width: columns.total - 8,
        align: "right",
      },
    );
  });
}

function drawPagoFirma(doc, remision, logoPath) {
  const left = MARGIN;
  const top = 430;

  drawBox(doc, left, top, 330, 60);
  doc.fontSize(9).fillColor(COLORS.blue);
  textCenteredInRow(doc, "MEDIO DE PAGO:", left + 6, top, 60);

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
    doc.fillColor(COLORS.black);
    textCenteredInRow(doc, opt.label, optionsLeft + 6, y - 2, rowHeight, {
      width: optionWidth - 12,
    });
    textCenteredInRow(doc, marcado ? "X" : "", optionsLeft + optionWidth, y - 2, rowHeight, {
      width: checkWidth,
      align: "center",
    });
    y += rowHeight + rowGap;
  });

  drawBox(doc, left, top + 70, 330, 60);
  doc.fontSize(9).fillColor(COLORS.blue);
  textCenteredInRow(doc, "RECIBE CONFORME:", left + 6, top + 70, 60);
  const lineY = top + 110;
  const recibeAreaLeft = left + 100; // Inicio del área (después del label)
  const recibeAreaWidth = 230; // Ancho para línea y texto (centrado)
  const recibeCenter = recibeAreaLeft + recibeAreaWidth / 2;
  const lineLen = 170;
  doc.moveTo(recibeCenter - lineLen / 2, lineY).lineTo(recibeCenter + lineLen / 2, lineY).stroke(COLORS.blue);
  doc.fontSize(8).fillColor(COLORS.gray);
  textCenteredInRow(doc, "Recibe Conforme", recibeCenter - 85, lineY + 2, 12, {
    width: 170,
    align: "center",
  });

  // Marca de agua deshabilitada por solicitud
}

function drawTotales(doc, remision) {
  const left = PAGE_WIDTH - MARGIN - 180;
  const top = 470;
  drawBox(doc, left, top, 180, 70);
  const separatorX = left + 100;
  doc.moveTo(separatorX, top).lineTo(separatorX, top + 70).stroke(COLORS.blue);
  const rows = [
    ["Sub - Total", formatCurrency(remision.subtotal)],
    [`IVA (${remision.ivaPorcentaje} %)`, formatCurrency(remision.iva)],
    ["Total", formatCurrency(remision.total)],
  ];
  let y = top;
  rows.forEach(([label, value], index) => {
    doc.fontSize(9).fillColor(COLORS.black);
    textCenteredInRow(doc, label, left + 8, y, 20, { width: 90 });
    textCenteredInRow(doc, value, left + 100, y, 20, { width: 70, align: "right" });
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

async function getLogoImage(paths, width) {
  const sourcePath = paths.find((logoPath) => fs.existsSync(logoPath)) || null;
  if (!sourcePath) return null;

  try {
    const buffer = await sharp(sourcePath)
      .resize({ width })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();
    return buffer;
  } catch (error) {
    return sourcePath;
  }
}

async function generateRemisionPdf(remision) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: MARGIN });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    Promise.all([
      getLogoImage(HEADER_LOGO_PATHS, 210),
      getLogoImage(WATERMARK_LOGO_PATHS, 260),
    ])
      .then(([headerLogo, watermarkLogo]) => {
        drawPageBorder(doc);
        drawLogoWatermark(doc, watermarkLogo);
        drawHeader(doc, remision, headerLogo);
        drawCliente(doc, remision);
        drawItems(doc, remision);
        drawPagoFirma(doc, remision, headerLogo);
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
