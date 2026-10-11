# AGENTS.md — AliviaParaCel (beta paciente)

App **Expo SDK 57 + React Native 0.86** para el portal paciente de AlivIA. En esta fase todo es **mock local**; no conectar a AlivIACare (`localhost:3000`, Prisma, `/api/mutate`).

## Modo mock

Hoy solo hay mock. `npm run dev` levanta Metro en el puerto **8083** con `createMockAuthRepository` y `createMockPatientRepository`. No hay modo `api` ni cliente HTTP.

En el teléfono, **Expo Go de Play Store para SDK 57**. La SDK 58 sigue en beta y no se usa. En PowerShell usa `npm.cmd` (`npm.cmd run dev`). En la terminal de Metro, `w` abre la versión web. Evita la tecla `a`: si Expo Go no está instalado, intenta descargarlo y suele fallar con `TypeError: fetch failed`. USB: `npm run open:android`. Redes restrictivas: `npm run dev:tunnel`.

Cuentas en `src/shared/mocks/users.mock.ts` (el login las repite bajo el formulario):

| Quién | RUT | Contraseña |
| --- | --- | --- |
| Constanza Elizondo (demo, con historial) | `9.876.543-3` | `alivia-demo` |
| María López (nueva, sin registros) | `15.234.678-6` | `alivia-nueva` |

El botón **Entrar en modo demo** entra como Constanza y no pide contraseña.

**Restablecer.** Con Constanza: **Perfil → Restablecer datos demo**. Reescribe `@alivia/patient-bootstrap/v1/constanza` con el fixture de `src/shared/mocks/patient.mock.ts`. El botón aparece solo con el perfil demo. Para el fixture limpio de María, borra `@alivia/patient-bootstrap/v1/nuevo` (en el teléfono, datos de la app en Expo Go; en la web, esa clave en `localStorage`) y el siguiente ingreso lo siembra de nuevo. Cerrar sesión solo borra el token `alivia.auth.token`. El botón no vacía `@alivia/outbox/v1/` ni `@alivia/reminders/v1/`.

**Fallas.** El código no permite inyectarlas. Los retrasos están fijos en `src/app/config/constants.ts`: login 800 ms (`MOCK_LOGIN_DELAY_MS`), datos del paciente 600 ms (`MOCK_PATIENT_DELAY_MS`).

## Comandos

```bash
npm install          # solo npm
npm run dev          # Metro en 8083, mock local. PowerShell: npm.cmd run dev
npm run lint
npm test             # Vitest (unit)
npm run test:e2e     # Playwright sobre Expo web (levanta Metro si hace falta)
```

E2E: [Playwright](https://playwright.dev/) en `tests/e2e/` — locators `getByRole` / `getByTestId`. Diseño en Figma: [design/FIGMA.md](design/FIGMA.md).

## Skills obligatorias (UI y código)

1. **Ponytail** — antes de escribir código: reutilizar plantilla, mínimo código, tests en lógica con ramas.
2. **Impeccable** — antes de UI: `/impeccable polish`, detector anti-slop, respetar `DESIGN.md`.
3. **Taste Skill** (`design-taste-frontend`, v2) — tipografía, spacing, bans; no `soft-skill`.

Instalación (requiere **git** en PATH):

```bash
npx skills add DietrichGebert/ponytail
npx impeccable install
npx skills add Leonxlnx/taste-skill --skill design-taste-frontend
```

En este repo ya hay `.cursor/rules/` (ponytail resumido + alivia-movil) y `.cursor/skills/alivia-movil/` si el CLI no puede clonar.

Leer también `.cursor/skills/alivia-movil/SKILL.md`, `PRODUCT.md` y `DESIGN.md`.

## Invariantes (desde AlivIACare)

- Identidad = **RUT chileno** (`src/shared/data/rut.ts`).
- Usuario **nuevo limpio**: sin check-ins, meds ni citas inventadas.
- Paciente **no** ve notas clínicas internas.
- Copy **español Latam**, tono adulto (dolor crónico).

- Gatillantes y alivios (DIF-01): `CheckInRecord` lleva `triggers?: string[]`, `reliefActions?: { action, relief: 'nada'|'algo'|'mucho', text? }[]` y `catalogVersion?`, los mismos nombres que la web (`CheckInExtensions` en `AlivIACare/src/data-source/types.ts`). Son opcionales: un registro antiguo con solo `why` debe seguir leyéndose (`attributionsOf`). Valores = `id` estables del catálogo `src/shared/data/trigger-catalog.ts` v1.0 (espejo manual del catálogo web; si cambia un id, subir `CATALOG_VERSION` y revisar la web). “Otro” se guarda como `otro:texto` en gatillantes y como `{ action: 'otro', text }` en alivios. Los pasos opcionales del check-in (DIF-03) siguen las reglas de visibilidad de la web (`utils/checkin-steps.ts`). No mezclar gatillantes y alivios en una lista.

- Consentimiento (MOB-06, paridad PAC-02 web): `PatientBootstrap.consent` / `consentHistory` persisten con fecha real y versión (`CONSENT_VERSION` en `utils/consent.ts`, espejo de la web). Sin registro = aceptado, sin fecha. Con consentimiento revocado el repositorio marca el check-in `sharedWithTeam: false` (solo en el teléfono, rotulado "No compartido con tu equipo"); ausente = compartido.

- Cambio de tokens de contraste aprobado por el PO el 2026-10-10 (DECISIONES_PO.md D-01).

## Estructura

- `src/features/patient/` — Diario, check-in, AlivIA, Comunidad
- `src/features/auth/` — login RUT + demo
- `src/shared/mocks/` — datos demo editables
- `src/shared/data/trigger-catalog.ts` — catálogo versionado de gatillantes/alivios (no es generado; `src/shared/core/` sí lo es)
- `src/features/*/api/` — mock local (`createMockAuthRepository`, `createMockPatientRepository`). Hoy solo hay mock

Referencia web (solo lectura): `../AlivIACare/src/screens/paciente/`.
