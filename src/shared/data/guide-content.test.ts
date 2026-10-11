import { describe, expect, it } from 'vitest';
import { guideCardsForPathology } from '@/shared/data/guide-content';

describe('MOB-13 · guide-content', () => {
  it('incluye tarjetas específicas por patología', () => {
    const cards = guideCardsForPathology('Fibromialgia');
    expect(cards.some((c) => /fibromialgia/i.test(c.title))).toBe(true);
    expect(cards.every((c) => c.src.trim().length > 0)).toBe(true);
  });
});
