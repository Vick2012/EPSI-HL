const { z, flattenError } = require("zod");

const requiredString = (msg) =>
  z.preprocess((v) => (v === null || v === undefined ? "" : v), z.string().trim().min(1, msg));
const safeLookupSchema = (label, max = 40) => z.preprocess(
  (v) => (v === null || v === undefined ? "" : v),
  z.string()
    .trim()
    .min(1, `${label} obligatorio`)
    .max(max, `${label} demasiado largo`)
    .regex(/^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/, `${label} inválido`)
);

const clienteSchema = z.object({
  tipo_documento: z.string().trim().optional().nullable(),
  numero_documento: safeLookupSchema("Número de documento"),
  dv: z.string().trim().optional().nullable(),
  nombre: requiredString("Nombre o razón social obligatorio"),
  direccion: requiredString("Dirección obligatoria"),
  ciudad: requiredString("Ciudad obligatoria"),
  telefono: requiredString("Teléfono obligatorio"),
  email: z.preprocess((v) => (v === null || v === undefined ? "" : v), z.email("Email inválido")),
});

function validateCliente(payload) {
  const result = clienteSchema.safeParse(payload);
  if (!result.success) {
    return { ok: false, errors: flattenError(result.error) };
  }
  return { ok: true, data: result.data };
}

module.exports = {
  validateCliente,
};
