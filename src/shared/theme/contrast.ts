import { colors, contrastSurfaces, type ThemeMode } from '@/shared/theme/colors';

export type ContrastPair = { name: string; fg: string; bg: string };

function channel(hex: string, index: number): number {
  const n = parseInt(hex.slice(1), 16);
  const value = index === 0 ? (n >> 16) & 255 : index === 1 ? (n >> 8) & 255 : n & 255;
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

/** Relación WCAG 2.x entre dos colores #rrggbb. */
export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const TEXT_KEYS = ['text', 'textMuted', 'textPrimary', 'textDanger', 'textWarning', 'textAccent'] as const;

/** Pares de tema declarados. El dolor se suma en el test, con la misma regla. */
export function declaredContrastPairs(): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  for (const mode of ['light', 'dark'] as const satisfies readonly ThemeMode[]) {
    const palette = colors[mode];
    for (const key of TEXT_KEYS) {
      for (const bg of contrastSurfaces[mode]) {
        pairs.push({ name: `${mode} ${key} sobre ${bg}`, fg: palette[key], bg });
      }
    }
    pairs.push({
      name: `${mode} texto sobre relleno primary`,
      fg: palette.onPrimary,
      bg: palette.primary,
    });
  }
  return pairs;
}
