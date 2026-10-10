import type { MockUser } from '@/shared/mocks/users.mock';

export type PasswordSignIn =
  | { status: 'ok'; user: MockUser; token: string }
  | { status: 'unknown-rut' }
  | { status: 'bad-password' };

export type AuthRepository = {
  signIn: (rut: string, password: string) => Promise<PasswordSignIn>;
  demoSession: () => Promise<{ user: MockUser; token: string }>;
};
