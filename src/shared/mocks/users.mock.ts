/**
 * Usuarios de prueba — edita libremente email, nombre y token.
 * El login acepta cualquier email que exista en esta lista.
 */
export type MockUser = {
  id: string;
  email: string;
  name: string;
  token: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    email: 'demo@plantilla.app',
    name: 'Usuario Demo',
    token: 'mock-token-demo',
  },
  {
    id: '2',
    email: 'admin@plantilla.app',
    name: 'Admin Mock',
    token: 'mock-token-admin',
  },
];

/** Credencial rápida para el botón "Entrar como demo" en Login */
export const DEMO_USER = MOCK_USERS[0];
