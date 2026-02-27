export const formatCurrency = (value: number) => `$ ${value.toLocaleString("es-CO")}`;

export const calcularDv = (nit: string) => {
  if (!nit) return "";
  const factors = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const reversed = String(nit).replace(/\D/g, "").split("").reverse();
  let sum = 0;
  reversed.forEach((digit, index) => {
    const factor = factors[index] ?? 0;
    sum += Number(digit) * factor;
  });
  const residue = sum % 11;
  const dv = residue > 1 ? 11 - residue : residue;
  return String(dv);
};
