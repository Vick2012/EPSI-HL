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
  const apiBase =
    import.meta.env.VITE_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:3001`;
  const response = await fetch(`${apiBase}/remisiones`, {
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
    const text = await response.text();
    throw new Error(text || "Error generando PDF");
  }

  return response.blob();
}
