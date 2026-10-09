// Generado: no editar

export const painColor = (v: number) => (v >= 7 ? '#d94f5a' : v >= 4 ? '#e08a2f' : '#2f8f63');
export function painLabel(value: number): string {
  if (value <= 1) return 'Sin dolor';
  if (value <= 3) return 'Leve';
  if (value <= 6) return 'Moderado';
  if (value <= 8) return 'Fuerte';
  return 'El peor dolor';
}
