import { describe, expect, it } from 'vitest';
import { painPlate, painTextColor } from '@/features/patient/utils/pain';
import { contrastSurfaces } from '@/shared/theme/colors';
import { contrastRatio, declaredContrastPairs, type ContrastPair } from '@/shared/theme/contrast';

const MIN = 4.5;

function allPairs(): ContrastPair[] {
  const pairs = declaredContrastPairs();
  for (const mode of ['light', 'dark'] as const) {
    for (const value of [1, 5, 8]) {
      for (const bg of contrastSurfaces[mode]) {
        pairs.push({
          name: `${mode} dolor ${value} sobre ${bg}`,
          fg: painTextColor(value, mode),
          bg,
        });
      }
    }
  }
  for (const value of [1, 5, 8]) {
    pairs.push({
      name: `blanco sobre placa de dolor ${value}`,
      fg: '#ffffff',
      bg: painPlate(value),
    });
  }
  return pairs;
}

describe('MOB-20 · contraste D-01', () => {
  it('cada par texto/fondo declarado llega a 4,5:1', () => {
    const failing = allPairs()
      .map((pair) => ({ ...pair, ratio: contrastRatio(pair.fg, pair.bg) }))
      .filter((pair) => pair.ratio < MIN);
    expect(failing).toEqual([]);
  });
});
