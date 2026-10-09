import { describe, expect, it } from 'vitest';
import { formatRut, isValidRut, normalizeRut, sameRut } from './rut';

describe('rut', () => {
  it('valida Constanza demo', () => {
    expect(isValidRut('9.876.543-3')).toBe(true);
    expect(sameRut('9876543-3', '9.876.543-3')).toBe(true);
  });

  it('valida usuario limpio mock', () => {
    expect(isValidRut('15234678-6')).toBe(true);
    expect(formatRut('15234678-6')).toBe('15.234.678-6');
  });

  it('rechaza DV incorrecto', () => {
    expect(isValidRut('15234678-0')).toBe(false);
    expect(normalizeRut('12.345.678-5')).toBe('12345678-5');
  });
});
