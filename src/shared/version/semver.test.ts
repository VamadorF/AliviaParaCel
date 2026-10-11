import { describe, expect, it } from 'vitest';
import { compareSemver, isAppUpdateRequired } from '@/shared/version/semver';

describe('MOB-14 · semver', () => {
  it('compara major, minor y patch', () => {
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
    expect(compareSemver('0.9.9', '1.0.0')).toBe(-1);
    expect(compareSemver('2.0.0', '1.9.9')).toBe(1);
  });

  it('detecta cuando hace falta actualizar', () => {
    expect(isAppUpdateRequired('1.0.0', '1.0.0')).toBe(false);
    expect(isAppUpdateRequired('1.0.0', '2.0.0')).toBe(true);
    expect(isAppUpdateRequired('1.2.3', '1.2.4')).toBe(true);
  });
});
