const { z } = require("zod");

const itemSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  valorUnitario: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

const remisionSchema = z.object({
  numero: z.string().min(1),
  fecha: z.string().min(1),
  usuario: z.string().optional(),
  metodoPago: z.enum(["efectivo", "nequi", "bancolombia"]),
  observaciones: z.string().optional(),
  anulada: z.boolean().optional(),
  cliente: z.object({
    tipoDocumento: z.string().optional(),
    nombre: z.string().min(1),
    nit: z.string().min(1),
    direccion: z.string().min(1),
    ciudad: z.string().optional(),
    telefono: z.string().optional(),
  }),
  items: z.array(itemSchema).min(1),
  subtotal: z.number().nonnegative(),
  ivaPorcentaje: z.number().nonnegative(),
  iva: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

function validateRemision(payload) {
  const result = remisionSchema.safeParse(payload);
  if (!result.success) {
    return { ok: false, errors: result.error.flatten() };
  }
  return { ok: true, data: result.data };
}

module.exports = {
  validateRemision,
};
