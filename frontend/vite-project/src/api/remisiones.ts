import { API_BASE } from "./base";

export type RemisionItem = {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  subtotal: number;
};

export type RemisionPayload = {
  numero: string;
  fecha: string;
  metodoPago: "efectivo" | "nequi" | "bancolombia";
  observaciones?: string;
  anulada?: boolean;
  cliente: {
    tipoDocumento?: string;
    nombre: string;
    nit: string;
    dv?: string;
    direccion: string;
    ciudad?: string;
    telefono?: string;
  };
  items: RemisionItem[];
  subtotal: number;
  ivaPorcentaje: number;
  iva: number;
  total: number;
};

export async function generarRemisionPdf(payload: RemisionPayload) {
  const token = window.localStorage.getItem("epsiToken");
  const response = await fetch(`${API_BASE}/remisiones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 409) {
      const text = await response.text();
      let msg = "La remisión ya existe. Usa otro número de remisión.";
      try {
        const json = JSON.parse(text);
        if (json?.message) msg = json.message;
      } catch (_) {}
      throw new Error(msg);
    }
    const text = await response.text();
    throw new Error(text || "Error generando PDF");
  }

  return response.blob();
}

export async function fetchRemision(numero: string, token: string) {
  const response = await fetch(`${API_BASE}/remisiones/${encodeURIComponent(numero)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
}

export async function updateRemision(numero: string, payload: RemisionPayload, token: string) {
  const response = await fetch(`${API_BASE}/remisiones/${encodeURIComponent(numero)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return response;
}

export async function fetchRemisionPdf(numero: string, token: string) {
  const response = await fetch(`${API_BASE}/remisiones/${encodeURIComponent(numero)}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
}

export async function fetchSiguienteNumero(token: string): Promise<number> {
  const response = await fetch(`${API_BASE}/remisiones/siguiente-numero`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return 1;
  const data = await response.json();
  return data?.siguiente ?? 1;
}
