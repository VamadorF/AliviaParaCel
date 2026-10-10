import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchDemoSession, signInWithPassword } from '@/features/auth/api/authApi';
import { secureTokenStorage } from '@/features/auth/session/secureTokenStorage';
import {
  clearQueryCache,
  forgetSessionToken,
  restoreSessionUser,
  saveSessionToken,
  setActiveUserId,
} from '@/features/auth/session/session';
import type { MockUser } from '@/shared/mocks/users.mock';
import { isValidRut } from '@/shared/data/rut';

type AuthContextValue = {
  user: MockUser | null;
  /** true mientras se lee el token al abrir la app. */
  isRestoring: boolean;
  /** true mientras entra con RUT o modo demo. */
  isLoading: boolean;
  signInWithRut: (rut: string, password: string) => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<MockUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Sin sesión montada, vaciar la caché. Si se limpia antes de desmontar,
  // TanStack Query vuelve a pedir el bootstrap del usuario que se va.
  useLayoutEffect(() => {
    if (user) return;
    clearQueryCache(queryClient);
  }, [user, queryClient]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const restored = await restoreSessionUser(secureTokenStorage);
        if (cancelled) return;
        if (restored) {
          setActiveUserId(restored.id);
          setUser(restored);
        }
      } catch {
        if (!cancelled) {
          await forgetSessionToken(secureTokenStorage).catch(() => undefined);
        }
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback(async (next: MockUser, token: string) => {
    try {
      await saveSessionToken(secureTokenStorage, token);
    } catch {
      throw new Error('No se pudo guardar la sesión en este dispositivo.');
    }
    setActiveUserId(next.id);
    setUser(next);
  }, []);

  const signInWithRut = useCallback(
    async (rut: string, password: string) => {
      if (!isValidRut(rut)) {
        throw new Error('RUT inválido. Revisa el dígito verificador.');
      }
      if (!password.trim()) {
        throw new Error('Ingresa tu contraseña.');
      }
      setIsLoading(true);
      try {
        const result = await signInWithPassword(rut, password);
        if (result.status === 'unknown-rut') {
          throw new Error(
            'RUT no registrado en esta beta. Usa modo demo o 15.234.678-6.',
          );
        }
        if (result.status === 'bad-password') {
          throw new Error('Contraseña incorrecta.');
        }
        await adopt(result.user, result.token);
      } finally {
        setIsLoading(false);
      }
    },
    [adopt],
  );

  const signInAsDemo = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await fetchDemoSession();
      await adopt(session.user, session.token);
    } finally {
      setIsLoading(false);
    }
  }, [adopt]);

  const signOut = useCallback(() => {
    void forgetSessionToken(secureTokenStorage)
      .then(() => {
        setUser(null);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isRestoring,
      isLoading,
      signInWithRut,
      signInAsDemo,
      signOut,
    }),
    [user, isRestoring, isLoading, signInWithRut, signInAsDemo, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
