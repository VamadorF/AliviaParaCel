/** MOB-14 · Respuesta mock de API-03 (versión mínima). Misma forma que usará el backend. */
export type MockAppConfig = {
  minAppVersion: string;
};

/** Por defecto no bloquea la app instalada (1.0.0 en app.json). Tests suben minAppVersion. */
export const MOCK_APP_CONFIG: MockAppConfig = {
  minAppVersion: '1.0.0',
};

export async function fetchMockAppConfig(): Promise<MockAppConfig> {
  return MOCK_APP_CONFIG;
}
