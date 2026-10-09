import { createMockAuthRepository } from '@/features/auth/api/mockAuthRepository';
import type { AuthRepository } from '@/features/auth/api/authRepository';

/** Punto de intercambio: sustituir por OAuth / API real. */
export const authRepository: AuthRepository = createMockAuthRepository();

export const resolveUserByRut = authRepository.resolveUserByRut;
export const fetchDemoUser = authRepository.demoUser;
