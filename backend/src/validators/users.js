const { z, flattenError } = require("zod");
const { isValidPlatformEmail } = require("../utils/platform-email");

const roleSchema = z.enum(["GERENCIAL", "DIRECCION", "SUPERVISION", "ASISTENTE", "APOYO", "AUXILIARES"]);
const statusSchema = z.enum(["ACTIVO", "INACTIVO"]);
const platformEmailSchema = z
  .email("Email inválido")
  .refine((email) => isValidPlatformEmail(email), "El correo debe pertenecer al dominio @epsihl.*");

const createUserSchema = z.object({
  email: platformEmailSchema,
  role: roleSchema,
  name: z.string().trim().optional(),
  status: statusSchema.default("ACTIVO"),
});

const updateUserSchema = z.object({
  email: platformEmailSchema.optional(),
  password: z.string().min(6).optional(),
  role: roleSchema.optional(),
  name: z.string().trim().optional(),
  status: statusSchema.optional(),
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
