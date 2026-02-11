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
  cliente: {
    tipoDocumento?: string;
    nombre: string;
    nit: string;
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
  const response = await fetch("http://localhost:3001/remisiones", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error generando PDF");
  }

  return response.blob();
}
