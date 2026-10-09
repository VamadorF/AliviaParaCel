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

export const MOCK_USERS: MockUser[] = [
  {
    id: 'constanza',
    rut: DEMO_RUT,
    name: 'Constanza Elizondo',
    profile: 'demo',
  },
  {
    id: 'nuevo',
    rut: CLEAN_RUT,
    name: 'María López',
    profile: 'clean',
  },
];

export const DEMO_USER = MOCK_USERS[0];

export function findUserByRut(input: string): MockUser | undefined {
  const rut = normalizeRut(input);
  return MOCK_USERS.find((u) => normalizeRut(u.rut) === rut);
}
