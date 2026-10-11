import { createMockAuthRepository } from '@/features/auth/api/mockAuthRepository';
import type { AuthRepository } from '@/features/auth/api/authRepository';

/** Punto de intercambio: sustituir por OAuth / API real. */
export const authRepository: AuthRepository = createMockAuthRepository();

export const signInWithPassword = authRepository.signIn;
export const fetchDemoSession = authRepository.demoSession;
