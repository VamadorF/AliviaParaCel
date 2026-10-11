import type { ThemeMode } from '@/shared/theme/colors';

export { painColor, painLabel } from '@/shared/core/pain';

/** Letra del número de dolor. El naranja de relleno (#e08a2f) no llega a 4,5:1. */
const PAIN_TEXT: Record<ThemeMode, { high: string; mid: string; low: string }> = {
  light: { high: '#b54449', mid: '#995a17', low: '#277953' },
  dark: { high: '#e8949a', mid: '#e8a55a', low: '#78b799' },
};

/** Fondo del número blanco en la tarjeta de dolor. Más oscuro que el trazo del gráfico. */
const PAIN_PLATE = { high: '#c94952', mid: '#a3651f', low: '#2b835b' } as const;

export function painTextColor(value: number, mode: ThemeMode): string {
  const row = PAIN_TEXT[mode];
  if (value >= 7) return row.high;
  if (value >= 4) return row.mid;
  return row.low;
}

export function painPlate(value: number): string {
  if (value >= 7) return PAIN_PLATE.high;
  if (value >= 4) return PAIN_PLATE.mid;
  return PAIN_PLATE.low;
}
