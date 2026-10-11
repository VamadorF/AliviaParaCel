import { describe, expect, it } from 'vitest';
import { pinValid, shouldLockAfterBackground } from '@/features/security/app-lock';

describe('MOB-25 · app lock', () => {
  it('bloquea tras N minutos en segundo plano', () => {
    const settings = { enabled: true, timeoutMinutes: 5, useBiometric: true };
    const bg = Date.parse('2026-10-11T12:00:00.000Z');
    expect(shouldLockAfterBackground(settings, bg, bg + 5 * 60_000)).toBe(true);
    expect(shouldLockAfterBackground(settings, bg, bg + 4 * 60_000)).toBe(false);
  });

  it('valida PIN de 4 a 6 dígitos', () => {
    expect(pinValid('1234')).toBe(true);
    expect(pinValid('123')).toBe(false);
  });
});
