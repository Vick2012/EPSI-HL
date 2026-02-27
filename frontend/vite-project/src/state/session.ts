const TOKEN_KEY = "epsiToken";
const ROLE_KEY = "epsiRole";
const EMAIL_KEY = "epsiUserEmail";
const CONSECUTIVO_KEY = "epsiRemisionConsecutivo";

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

export const getRole = () => window.localStorage.getItem(ROLE_KEY);
export const setRole = (role: string) => window.localStorage.setItem(ROLE_KEY, role);
export const clearRole = () => window.localStorage.removeItem(ROLE_KEY);

export const getUserEmail = () => window.localStorage.getItem(EMAIL_KEY);
export const setUserEmail = (email: string) => window.localStorage.setItem(EMAIL_KEY, email);
export const clearUserEmail = () => window.localStorage.removeItem(EMAIL_KEY);

export const clearSession = () => {
  clearToken();
  clearRole();
  clearUserEmail();
};

export const canAccessUsersModule = (role: string | null) =>
  role === "GERENCIAL" || role === "DIRECCION" || role === "SUPERVISION";

export const getConsecutivo = () => {
  const raw = window.localStorage.getItem(CONSECUTIVO_KEY);
  const value = Number(raw || 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

export const setConsecutivo = (value: number) => {
  window.localStorage.setItem(CONSECUTIVO_KEY, String(value));
};

export const formatConsecutivo = (value: number) => `RM ${String(value).padStart(3, "0")}`;
