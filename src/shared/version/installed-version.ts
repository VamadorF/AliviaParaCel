import Constants from 'expo-constants';

/** Versión de la app instalada (app.json / EAS). */
export function installedAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}
