# AGENTS.md — AliviaParaCel (beta paciente)

App **Expo + React Native** para el portal paciente de AlivIA. En esta fase todo es **mock local**; no conectar a AlivIACare (`localhost:3000`, Prisma, `/api/mutate`).

## Comandos

```bash
npm install          # solo npm
npm start            # Metro; w = web, a = Android
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

## Estructura

- `src/features/patient/` — Diario, check-in, AlivIA, Comunidad
- `src/features/auth/` — login RUT + demo
- `src/shared/mocks/` — datos demo editables
- `src/features/*/api/` — sustituir por `fetch` real más adelante

Referencia web (solo lectura): `../AlivIACare/src/screens/paciente/`.
