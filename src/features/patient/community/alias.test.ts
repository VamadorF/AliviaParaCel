import { describe, expect, it } from 'vitest';
import { communityDisplayName, sanitizeAlias } from '@/features/patient/community/alias';

describe('COM-05 · seudónimo', () => {
  it('muestra alias si existe', () => {
    expect(communityDisplayName({ author: 'María L.', displayAlias: 'Mariposa' })).toBe('Mariposa');
  });

  it('recorta alias largos', () => {
    expect(sanitizeAlias('  alias-muy-largo-que-supera-treinta-y-dos  ')).toHaveLength(32);
  });
});
