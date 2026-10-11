import { MOCK_LOGIN_DELAY_MS } from '@/app/config/constants';
import type { AuthRepository } from '@/features/auth/api/authRepository';
import { createMockToken } from '@/features/auth/session/session';
import { DEMO_USER, findCredentials } from '@/shared/mocks/users.mock';

export function createMockAuthRepository(delayMs = MOCK_LOGIN_DELAY_MS): AuthRepository {
  const wait = () =>
    delayMs > 0 ? new Promise((r) => setTimeout(r, delayMs)) : Promise.resolve();

  return {
    async signIn(rut, password) {
      await wait();
      const account = findCredentials(rut);
      if (!account) return { status: 'unknown-rut' };
      if (password.trim() !== account.password) return { status: 'bad-password' };
      return {
        status: 'ok',
        user: account.user,
        token: createMockToken(account.user.id),
      };
    },
    async demoSession() {
      await wait();
      return { user: DEMO_USER, token: createMockToken(DEMO_USER.id) };
    },
  };
}
