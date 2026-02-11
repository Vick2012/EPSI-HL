const express = require("express");
const cors = require("cors");
const path = require("path");
const remisionesRouter = require("./routes/remisiones");
const { authRouter } = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));
app.use("/auth", authRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "epsi-hl-api" });
});

app.get("/", (_req, res) => {
  res.send("EPSI HL API en ejecución");
});

app.use("/remisiones", remisionesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
