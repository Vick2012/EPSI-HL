import { describe, it, expect } from "vitest";
import { validateCliente } from "../../src/validators/cliente.js";

describe("validateCliente", () => {
  const validPayload = {
    tipo_documento: "NIT",
    numero_documento: "900123456",
    dv: "7",
    nombre: "Empresa SAS",
    direccion: "Calle 123",
    ciudad: "Bogotá",
    telefono: "3001234567",
    email: "contacto@empresa.com",
  };

  it("acepta payload válido", () => {
    const result = validateCliente(validPayload);
    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.email).toBe("contacto@empresa.com");
  });

  it("rechaza cuando falta numero_documento", () => {
    const { numero_documento, ...rest } = validPayload;
    const result = validateCliente({ ...rest, numero_documento: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.fieldErrors.numero_documento).toBeDefined();
  });

  it("rechaza cuando falta nombre", () => {
    const result = validateCliente({ ...validPayload, nombre: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.fieldErrors.nombre).toBeDefined();
  });

  it("rechaza email inválido", () => {
    const result = validateCliente({ ...validPayload, email: "no-es-email" });
    expect(result.ok).toBe(false);
    expect(result.errors.fieldErrors.email).toBeDefined();
  });

  it("rechaza cuando falta dirección", () => {
    const result = validateCliente({ ...validPayload, direccion: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.fieldErrors.direccion).toBeDefined();
  });

  it("rechaza numero_documento con patrón sospechoso", () => {
    const result = validateCliente({ ...validPayload, numero_documento: "123'; DROP TABLE clientes; --" });
    expect(result.ok).toBe(false);
    expect(result.errors.fieldErrors.numero_documento).toBeDefined();
  });
});
