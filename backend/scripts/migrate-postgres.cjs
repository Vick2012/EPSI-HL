require("dotenv").config();

const { createPgPool, runMigrations } = require("../src/db");

async function main() {
  const pool = createPgPool();
  try {
    await pool.query("SELECT 1");
    await runMigrations(pool);
    console.log("PostgreSQL schema ready.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("PostgreSQL migration failed:", error);
  process.exit(1);
});
