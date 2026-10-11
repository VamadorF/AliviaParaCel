/** ACC-07 · Números visibles con locale es-CL (coma decimal). */

export function formatDecimal(value: number, fractionDigits = 1): string {
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatInteger(value: number): string {
  return value.toLocaleString('es-CL', { maximumFractionDigits: 0 });
}
