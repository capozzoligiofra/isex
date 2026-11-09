export const fmt = (n: number, digits = 0) =>
  n.toLocaleString("it-IT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
