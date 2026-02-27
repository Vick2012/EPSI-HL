import { API_BASE } from "./base";

export type ClientePayload = {
  tipo_documento: string | null;
  numero_documento: string;
  dv: string | null;
  nombre: string | null;
  ciudad: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
};

export const fetchCliente = async (nit: string, token: string) => {
  const response = await fetch(`${API_BASE}/clientes/${encodeURIComponent(nit)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const saveCliente = async (payload: ClientePayload, token: string) => {
  const response = await fetch(`${API_BASE}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return response;
};

export const exportClientes = async (token: string) => {
  const response = await fetch(`${API_BASE}/clientes/exportar`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};
