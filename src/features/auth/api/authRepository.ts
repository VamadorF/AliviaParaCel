import type { MockUser } from '@/shared/mocks/users.mock';

export type AuthRepository = {
  resolveUserByRut: (rut: string) => Promise<MockUser | null>;
  demoUser: () => Promise<MockUser>;
};
