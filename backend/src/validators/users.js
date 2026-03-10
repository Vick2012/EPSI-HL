const { z, flattenError } = require("zod");

const roleSchema = z.enum(["GERENCIAL", "DIRECCION", "SUPERVISION", "ASISTENTE", "APOYO", "AUXILIARES"]);

const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: roleSchema,
  name: z.string().trim().optional(),
});

const updateUserSchema = z.object({
  email: z.email().optional(),
  password: z.string().min(6).optional(),
  role: roleSchema.optional(),
  name: z.string().trim().optional(),
});

function validateUserCreate(payload) {
  const result = createUserSchema.safeParse(payload);
  if (!result.success) {
    return { ok: false, errors: flattenError(result.error) };
  }
  return { ok: true, data: result.data };
}

function validateUserUpdate(payload) {
  const result = updateUserSchema.safeParse(payload);
  if (!result.success) {
    return { ok: false, errors: flattenError(result.error) };
  }
  return { ok: true, data: result.data };
}

module.exports = {
  validateUserCreate,
  validateUserUpdate,
};
