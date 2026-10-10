import { normalizeRut } from '@/shared/data/rut';

export type PatientProfileKind = 'demo' | 'clean';

export type MockUser = {
  id: string;
  rut: string;
  name: string;
  profile: PatientProfileKind;
};

export const DEMO_RUT = '9876543-3';
export const CLEAN_RUT = '15234678-6';

/** Contraseñas de la beta. Solo fixtures locales; no son secretos reales. */
export const DEMO_PASSWORD = 'alivia-demo';
export const CLEAN_PASSWORD = 'alivia-nueva';

type MockAccount = MockUser & { password: string };

const ACCOUNTS: MockAccount[] = [
  {
    id: 'constanza',
    rut: DEMO_RUT,
    name: 'Constanza Elizondo',
    profile: 'demo',
    password: DEMO_PASSWORD,
  },
  {
    id: 'nuevo',
    rut: CLEAN_RUT,
    name: 'María López',
    profile: 'clean',
    password: CLEAN_PASSWORD,
  },
];

function toUser(account: MockAccount): MockUser {
  return {
    id: account.id,
    rut: account.rut,
    name: account.name,
    profile: account.profile,
  };
}

export const MOCK_USERS: MockUser[] = ACCOUNTS.map(toUser);

export const DEMO_USER = MOCK_USERS[0];

export function findUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

export function findCredentials(
  input: string,
): { user: MockUser; password: string } | undefined {
  const rut = normalizeRut(input);
  const account = ACCOUNTS.find((u) => normalizeRut(u.rut) === rut);
  if (!account) return undefined;
  return { user: toUser(account), password: account.password };
}

export function findUserByRut(input: string): MockUser | undefined {
  return findCredentials(input)?.user;
}
