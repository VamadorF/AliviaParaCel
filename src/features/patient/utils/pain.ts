export function painLabel(value: number): string {
  if (value <= 1) return 'Sin dolor';
  if (value <= 3) return 'Leve';
  if (value <= 6) return 'Moderado';
  if (value <= 8) return 'Fuerte';
  return 'El peor dolor';
}

export function painColor(value: number): string {
  if (value >= 7) return '#b03a44';
  if (value >= 4) return '#e08a2f';
  return '#256e4d';
}
