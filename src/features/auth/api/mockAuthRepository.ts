import { MOCK_LOGIN_DELAY_MS } from '@/app/config/constants';
import { DEMO_USER, findUserByRut } from '@/shared/mocks/users.mock';
import type { AuthRepository } from '@/features/auth/api/authRepository';

export function createMockAuthRepository(delayMs = MOCK_LOGIN_DELAY_MS): AuthRepository {
  const wait = () =>
    delayMs > 0 ? new Promise((r) => setTimeout(r, delayMs)) : Promise.resolve();

  return {
    async resolveUserByRut(rut) {
      await wait();
      return findUserByRut(rut) ?? null;
    },
    async demoUser() {
      await wait();
      return DEMO_USER;
    },
  };
}
