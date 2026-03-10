export const API_BASE =
  import.meta.env.VITE_API_URL || `${globalThis.location.protocol}//${globalThis.location.hostname}:3001`;

export const ASSETS_BASE = import.meta.env.VITE_ASSETS_URL || API_BASE;

/** Número WhatsApp para soporte (formato: 573058138022, sin + ni espacios). Definir en .env */
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "";
const WHATSAPP_MESSAGE = import.meta.env.VITE_WHATSAPP_MESSAGE || "Hola, necesito ayuda con el Sistema IRIS";

export const getWhatsAppHelpUrl = (): string => {
  const num = (WHATSAPP_NUMBER || "").replaceAll(/\D/g, ""); // NOSONAR
  if (!num) return "";
  const text = encodeURIComponent(WHATSAPP_MESSAGE);
  return `https://wa.me/${num}?text=${text}`;
};

export const hasWhatsAppHelp = (): boolean => Boolean((WHATSAPP_NUMBER || "").replaceAll(/\D/g, "")); // NOSONAR
