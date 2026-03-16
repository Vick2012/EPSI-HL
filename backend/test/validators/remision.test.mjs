import { describe, it, expect } from "vitest";
import { validateRemision } from "../../src/validators/remision.js";

describe("validateRemision", () => {
  const validPayload = {
    numero: "RM 001",
    fecha: "2025-03-07",
    metodoPago: "efectivo",
    bodega: "INCOLTRANS",
    cliente: {
      nombre: "Cliente SAS",
      nit: "900123456",
      direccion: "Calle 123",
    },
    items: [{ descripcion: "Item 1", cantidad: 1, valorUnitario: 1000, subtotal: 1000 }],
    subtotal: 1000,
    ivaPorcentaje: 19,
    iva: 190,
    total: 1190,
  };

  it("acepta payload válido", () => {
    const result = validateRemision(validPayload);
    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("rechaza metodoPago inválido", () => {
    const result = validateRemision({ ...validPayload, metodoPago: "tarjeta" });
    expect(result.ok).toBe(false);
  });

  it("rechaza items vacíos", () => {
    const result = validateRemision({ ...validPayload, items: [] });
    expect(result.ok).toBe(false);
  });

  it("rechaza cuando falta cliente.nombre", () => {
    const result = validateRemision({ ...validPayload, cliente: { ...validPayload.cliente, nombre: "" } });
    expect(result.ok).toBe(false);
  });
});
