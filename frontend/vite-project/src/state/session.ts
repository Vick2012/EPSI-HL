const TOKEN_KEY = "epsiToken";
const ROLE_KEY = "epsiRole";
const EMAIL_KEY = "epsiUserEmail";
const CONSECUTIVO_KEY = "epsiRemisionConsecutivo";

export const getToken = () => globalThis.localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => globalThis.localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => globalThis.localStorage.removeItem(TOKEN_KEY);

export const getRole = () => globalThis.localStorage.getItem(ROLE_KEY);
export const setRole = (role: string) => globalThis.localStorage.setItem(ROLE_KEY, role);
const clearRole = () => globalThis.localStorage.removeItem(ROLE_KEY);

export const getUserEmail = () => globalThis.localStorage.getItem(EMAIL_KEY);
export const setUserEmail = (email: string) => globalThis.localStorage.setItem(EMAIL_KEY, email);
const clearUserEmail = () => globalThis.localStorage.removeItem(EMAIL_KEY);

export const clearSession = () => {
  clearToken();
  clearRole();
  clearUserEmail();
};

export const canAccessUsersModule = (role: string | null) =>
  role === "GERENCIAL" || role === "DIRECCION";

export const getConsecutivo = () => {
  const raw = globalThis.localStorage.getItem(CONSECUTIVO_KEY);
  const value = Number(raw || 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

export const setConsecutivo = (value: number) => {
  globalThis.localStorage.setItem(CONSECUTIVO_KEY, String(value));
};

export const formatConsecutivo = (value: number) => `RM ${String(value).padStart(3, "0")}`;
