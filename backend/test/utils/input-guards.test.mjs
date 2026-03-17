import { describe, it, expect } from "vitest";
import { validateLookupKey, validatePositiveIntegerId } from "../../src/utils/input-guards.js";

describe("input guards", () => {
  it("acepta claves de búsqueda válidas", () => {
    expect(validateLookupKey("RM 001")).toEqual({ ok: true, value: "RM 001" });
    expect(validateLookupKey("900123456/7")).toEqual({ ok: true, value: "900123456/7" });
  });

  it("rechaza payloads sospechosos para lookup", () => {
    expect(validateLookupKey("' OR 1=1 --").ok).toBe(false);
    expect(validateLookupKey("abc; DROP TABLE users").ok).toBe(false);
    expect(validateLookupKey("")).toEqual({ ok: false, message: "Valor inválido" });
  });

  it("acepta ids enteros positivos", () => {
    expect(validatePositiveIntegerId("42")).toEqual({ ok: true, value: 42 });
  });

  it("rechaza ids no numéricos o manipulados", () => {
    expect(validatePositiveIntegerId("1 OR 1=1").ok).toBe(false);
    expect(validatePositiveIntegerId("-1").ok).toBe(false);
    expect(validatePositiveIntegerId("1;DROP").ok).toBe(false);
  });
});
