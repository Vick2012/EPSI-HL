import { describe, it, expect } from "vitest";
import { formatCurrency, calcularDv } from "./format";

describe("formatCurrency", () => {
  it("formatea números con separadores de miles", () => {
    expect(formatCurrency(1000)).toBe("$ 1.000");
    expect(formatCurrency(1234567)).toBe("$ 1.234.567");
  });

  it("formatea cero", () => {
    expect(formatCurrency(0)).toBe("$ 0");
  });
});

describe("calcularDv", () => {
  it("retorna string vacío para NIT vacío", () => {
    expect(calcularDv("")).toBe("");
  });

  it("calcula DV para NIT colombiano", () => {
    // 900123456 tiene DV conocido
    const dv = calcularDv("900123456");
    expect(dv).toMatch(/^\d$/);
    expect(dv.length).toBe(1);
  });

  it("ignora caracteres no numéricos", () => {
    const dv1 = calcularDv("900.123.456");
    const dv2 = calcularDv("900123456");
    expect(dv1).toBe(dv2);
  });
});
