/**
 * Variables de entorno públicas (inyectadas por Metro en build/dev).
 * Tras cambiar .env, reinicia: npm start
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.ejemplo.com';

export const APP_NAME =
  process.env.EXPO_PUBLIC_APP_NAME ?? 'Plantilla Móvil';

export const IS_DEVELOPMENT = __DEV__;
