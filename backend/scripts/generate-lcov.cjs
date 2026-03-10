/**
 * Genera lcov.info desde coverage/coverage-final.json (formato Istanbul/V8)
 * Usa istanbul-lib-* para generar el reporte.
 */
const fs = require("node:fs");
const path = require("node:path");
const libCoverage = require("istanbul-lib-coverage");
const libReport = require("istanbul-lib-report");
const reports = require("istanbul-reports");

const projectRoot = path.join(__dirname, "..");
const coveragePath = path.join(projectRoot, "coverage", "coverage-final.json");
const outDir = path.join(projectRoot, "coverage");

if (!fs.existsSync(coveragePath)) {
  console.warn("No coverage-final.json. Run: npm run test:coverage");
  process.exit(0);
}

const coverageMap = libCoverage.createCoverageMap(JSON.parse(fs.readFileSync(coveragePath, "utf8")));
const context = libReport.createContext({ coverageMap, dir: outDir });
reports.create("lcov", {}).execute(context);

const lcovPath = path.join(outDir, "lcov.info");
if (fs.existsSync(lcovPath)) {
  console.log("Generated", lcovPath);
}
