import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { fetchDemoUser, resolveUserByRut } from '@/features/auth/api/authApi';
import type { MockUser } from '@/shared/mocks/users.mock';
import { isValidRut } from '@/shared/data/rut';

type AuthContextValue = {
  user: MockUser | null;
  isLoading: boolean;
  signInWithRut: (rut: string) => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithRut = useCallback(async (rut: string) => {
    if (!isValidRut(rut)) {
      throw new Error('RUT inválido. Revisa el dígito verificador.');
    }
    setIsLoading(true);
    const match = await resolveUserByRut(rut);
    if (!match) {
      setIsLoading(false);
      throw new Error('RUT no registrado en esta beta. Usa modo demo o 15.234.678-6.');
    }
    setUser(match);
    setIsLoading(false);
  }, []);

  const signInAsDemo = useCallback(async () => {
    setIsLoading(true);
    setUser(await fetchDemoUser());
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, isLoading, signInWithRut, signInAsDemo, signOut }),
    [user, isLoading, signInWithRut, signInAsDemo, signOut],
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
