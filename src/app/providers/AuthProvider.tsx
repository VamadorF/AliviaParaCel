import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { MOCK_LOGIN_DELAY_MS } from '@/app/config/constants';
import {
  DEMO_USER,
  MOCK_USERS,
  type MockUser,
} from '@/shared/mocks/users.mock';

type AuthContextValue = {
  user: MockUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function findMockUser(email: string): MockUser | undefined {
  const normalized = email.trim().toLowerCase();
  return MOCK_USERS.find((u) => u.email.toLowerCase() === normalized);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, MOCK_LOGIN_DELAY_MS));
    const match = findMockUser(email);
    if (!match) {
      setIsLoading(false);
      throw new Error('Usuario no encontrado en users.mock.ts');
    }
    setUser(match);
    setIsLoading(false);
  }, []);

  const signInAsDemo = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, MOCK_LOGIN_DELAY_MS));
    setUser(DEMO_USER);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signInAsDemo, signOut }),
    [user, isLoading, signIn, signInAsDemo, signOut],
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
