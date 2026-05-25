const { z, flattenError } = require("zod");

const safeLookupSchema = (label, max = 80) => z.string()
  .trim()
  .min(1, `${label} obligatorio`)
  .max(max, `${label} demasiado largo`)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/, `${label} inválido`);

const itemSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  valorUnitario: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

const remisionSchema = z.object({
  numero: safeLookupSchema("Número de remisión"),
  fecha: z.string().min(1),
  usuario: z.string().optional(),
  metodoPago: z.enum(["efectivo", "nequi", "bancolombia", "credito"]),
  metodosPago: z.array(z.object({
    key: z.string(),
    label: z.string(),
    monto: z.number().min(0),
  })).optional(),
  observaciones: z.string().optional(),
  bodega: z.string().trim().min(1),
  anulada: z.boolean().optional(),
  cliente: z.object({
    tipoDocumento: z.string().optional(),
    nombre: z.string().min(1),
    nit: safeLookupSchema("NIT", 40),
    dv: z.string().optional(),
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
    return { ok: false, errors: flattenError(result.error) };
  }
  return { ok: true, data: result.data };
}

module.exports = {
  validateRemision,
};
