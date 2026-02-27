export const API_BASE =
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

export const ASSETS_BASE = import.meta.env.VITE_ASSETS_URL || API_BASE;
