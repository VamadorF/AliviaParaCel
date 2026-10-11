import { describe, expect, it } from 'vitest';
import { formatDecimal } from '@/shared/format/es-cl';

describe('ACC-07 · decimales con coma', () => {
  it('formatea con es-CL', () => {
    expect(formatDecimal(4.5)).toMatch(/4,5/);
  });
});
