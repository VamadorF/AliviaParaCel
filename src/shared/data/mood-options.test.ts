import { describe, expect, it } from 'vitest';
import { MOOD_OPTIONS, moodChoices, moodLabel } from './mood-options';

const GENDERED = /\b(cansad|ansios|animad|tranquil|decaíd|agotad|triste)[oa]\b/i;

describe('PAC-06 · ánimo sin género gramatical', () => {
  it('ofrece la misma lista que la web', () => {
    expect([...MOOD_OPTIONS]).toEqual([
      'Muy mal',
      'Mal',
      'Regular',
      'Bien',
      'Muy bien',
      'Con cansancio',
      'Con ansiedad',
    ]);
    for (const option of MOOD_OPTIONS) expect(option).not.toMatch(GENDERED);
    expect(MOOD_OPTIONS as readonly string[]).not.toContain('Cansada');
    expect(MOOD_OPTIONS as readonly string[]).not.toContain('Ansiosa');
  });

  it('un ánimo ya guardado se muestra tal cual', () => {
    expect(moodLabel('Cansada')).toBe('Cansada');
    expect(moodLabel('Ansiosa')).toBe('Ansiosa');
    expect(moodLabel('  Con cansancio  ')).toBe('Con cansancio');
    expect(moodLabel(null)).toBe('');
  });

  it('el formulario sigue ofreciendo el valor antiguo si ya venía elegido', () => {
    expect(moodChoices('Cansada')).toEqual([...MOOD_OPTIONS, 'Cansada']);
    expect(moodChoices('Bien')).toEqual([...MOOD_OPTIONS]);
    expect(moodChoices('')).toEqual([...MOOD_OPTIONS]);
  });
});
