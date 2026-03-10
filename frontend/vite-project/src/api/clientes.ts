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

export type SaveClienteResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: { formErrors: string[]; fieldErrors: Record<string, string[]> } };

export const saveCliente = async (payload: ClientePayload, token: string): Promise<SaveClienteResult> => {
  const response = await fetch(`${API_BASE}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (response.ok) return { ok: true };
  try {
    const data = await response.json();
    return {
      ok: false,
      message: data.message,
      errors: data.errors,
    };
  } catch {
    return { ok: false, message: "No se pudo guardar el cliente." };
  }
};

export const exportClientes = async (token: string) => {
  const response = await fetch(`${API_BASE}/clientes/exportar`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};
