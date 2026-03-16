const PLATFORM_EMAIL_REGEX = /^[a-z0-9._%+-]+@epsihl\.[a-z0-9.-]+$/i;

function normalizePlatformEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidPlatformEmail(value) {
  return PLATFORM_EMAIL_REGEX.test(normalizePlatformEmail(value));
}

module.exports = {
  normalizePlatformEmail,
  isValidPlatformEmail,
  PLATFORM_EMAIL_REGEX,
};
