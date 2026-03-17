const SAFE_LOOKUP_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/;

function invalid(message) {
  return { ok: false, message };
}

function validateLookupKey(value, fieldName = "Valor") {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return invalid(`${fieldName} inválido`);
  }
  if (normalized.length > 80) {
    return invalid(`${fieldName} demasiado largo`);
  }
  if (!SAFE_LOOKUP_PATTERN.test(normalized)) {
    return invalid(`${fieldName} contiene caracteres no permitidos`);
  }
  return { ok: true, value: normalized };
}

function validatePositiveIntegerId(value, fieldName = "ID") {
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) {
    return invalid(`${fieldName} inválido`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return invalid(`${fieldName} inválido`);
  }
  return { ok: true, value: parsed };
}

module.exports = {
  validateLookupKey,
  validatePositiveIntegerId,
};
