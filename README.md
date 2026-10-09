# Plantilla móvil (Expo + Metro)

App vacía con **mocks editables** para arrancar proyectos en celular. Basada en la guía `expo-y-metro-plantilla.md`.

## Arranque rápido

```bash
npm install
npm start
```

En la terminal de Expo: **`a`** Android, **`i`** iOS, **`w`** web. Compatible con **Expo Go** (sin módulos nativos extra).

## Dónde editar los mocks

| Archivo | Contenido |
|---------|-----------|
| `src/shared/mocks/users.mock.ts` | Usuarios y tokens de login ficticio |
| `src/shared/mocks/weather.mock.ts` | Ciudad, temperatura y pronóstico |
| `src/features/home/api/weatherApi.ts` | Punto para sustituir `fetch` real |
| `.env` (copia desde `.env.example`) | `EXPO_PUBLIC_*` |

## Estructura

```
src/app/          → bootstrap, providers, navegación
src/features/     → auth, home, profile
src/shared/       → componentes, tema, i18n, mocks
```

## Personalizar para tu producto

1. Renombra en `app.json`: `name`, `slug`, `bundleIdentifier`, `package`.
2. Sustituye iconos en `public/` (`icon.png`, `splash.png`, etc.).
3. Añade pantallas en `src/features/<nombre>/` y regístralas en `MainTabs` o un stack nuevo.
4. Para builds nativos: `npx expo prebuild` (genera `android/` e `ios/`, ignorados en git).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Metro + Expo Dev Tools |
| `npm run android` | Compilar/ejecutar Android |
| `npm run ios` | Compilar/ejecutar iOS (macOS) |
| `npm run web` | Vista web con Metro |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

## Documentación interna

Ver [expo-y-metro-plantilla.md](./expo-y-metro-plantilla.md) para CNG, EAS, alias `@/` y checklist completo.
