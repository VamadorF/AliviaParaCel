import { describe, expect, it } from 'vitest';
import { createMockAuthRepository } from '@/features/auth/api/mockAuthRepository';
import { userIdFromMockToken } from '@/features/auth/session/session';
import {
  CLEAN_PASSWORD,
  CLEAN_RUT,
  DEMO_PASSWORD,
  DEMO_RUT,
} from '@/shared/mocks/users.mock';

describe('MOB-03 · login contra fixtures', () => {
  const auth = createMockAuthRepository(0);

  it('acepta RUT y contraseña de cada persona', async () => {
    const demo = await auth.signIn('9.876.543-3', DEMO_PASSWORD);
    expect(demo.status).toBe('ok');
    if (demo.status !== 'ok') return;
    expect(demo.user.id).toBe('constanza');
    expect(demo.user).not.toHaveProperty('password');
    expect(userIdFromMockToken(demo.token)).toBe('constanza');

    const clean = await auth.signIn(CLEAN_RUT, `  ${CLEAN_PASSWORD}  `);
    expect(clean.status).toBe('ok');
    if (clean.status !== 'ok') return;
    expect(clean.user.name).toBe('María López');
    expect(userIdFromMockToken(clean.token)).toBe('nuevo');
  });

  it('rechaza la contraseña de la otra persona', async () => {
    expect((await auth.signIn(DEMO_RUT, CLEAN_PASSWORD)).status).toBe('bad-password');
    expect((await auth.signIn(CLEAN_RUT, 'no-es')).status).toBe('bad-password');
  });

  it('rechaza un RUT que no está en los fixtures', async () => {
    expect((await auth.signIn('12.345.678-5', DEMO_PASSWORD)).status).toBe('unknown-rut');
  });

  it('el modo demo entrega a Constanza con token', async () => {
    const session = await auth.demoSession();
    expect(session.user.id).toBe('constanza');
    expect(userIdFromMockToken(session.token)).toBe('constanza');
  });
});
