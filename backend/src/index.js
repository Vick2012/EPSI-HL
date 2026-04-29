require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("node:path");
const remisionesRouter = require("./routes/remisiones");
const { authRouter } = require("./routes/auth");
const usersRouter = require("./routes/users");
const clientesRouter = require("./routes/clientes");
const { createPgPool, runMigrations } = require("./db");

const app = express();

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: [
      "https://iris.epsihl.com.co",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.LOGIN_RATE_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiados intentos. Intenta de nuevo más tarde." },
});
app.use("/auth/login", loginLimiter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/clientes", clientesRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "epsi-hl-api" });
});

app.get("/", (_req, res) => {
  res.send("EPSI HL API en ejecución");
});

app.use("/remisiones", remisionesRouter);

app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  const message = status >= 500 ? "Error interno" : err.message;
  return res.status(status).json({ ok: false, message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`API running on http://localhost:${PORT}`);
  const pool = createPgPool();
  try {
    await pool.query("SELECT 1");
    await runMigrations(pool);
    console.log("PostgreSQL schema ready.");
  } catch (err) {
    console.error("Startup migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
});
