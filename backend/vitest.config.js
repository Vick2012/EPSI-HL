/** @type {import('vitest').UserConfig} */
module.exports = {
  testEnvironment: "node",
  include: ["test/**/*.test.mjs"],
  test: { globals: true },
  coverage: {
    provider: "v8",
    reporter: ["text", ["lcov", { projectRoot: "." }]],
    reportsDirectory: "./coverage",
    include: ["src/**/*.js"],
    exclude: ["src/index.js", "node_modules/**", "scripts/**"],
  },
  globals: true,
};
