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

- Gatillantes y alivios (DIF-01): `CheckInRecord` lleva `triggers?: string[]`, `reliefActions?: { action, relief: 'nada'|'algo'|'mucho', text? }[]` y `catalogVersion?`, los mismos nombres que la web (`CheckInExtensions` en `AlivIACare/src/data-source/types.ts`). Son opcionales: un registro antiguo con solo `why` debe seguir leyéndose (`attributionsOf`). Valores = `id` estables del catálogo `src/shared/data/trigger-catalog.ts` v1.0 (espejo manual del catálogo web; si cambia un id, subir `CATALOG_VERSION` y revisar la web). “Otro” se guarda como `otro:texto` en gatillantes y como `{ action: 'otro', text }` en alivios. Los pasos opcionales del check-in (DIF-03) siguen las reglas de visibilidad de la web (`utils/checkin-steps.ts`). No mezclar gatillantes y alivios en una lista.

## Estructura

- `src/features/patient/` — Diario, check-in, AlivIA, Comunidad
- `src/features/auth/` — login RUT + demo
- `src/shared/mocks/` — datos demo editables
- `src/shared/data/trigger-catalog.ts` — catálogo versionado de gatillantes/alivios (no es generado; `src/shared/core/` sí lo es)
- `src/features/*/api/` — sustituir por `fetch` real más adelante

Referencia web (solo lectura): `../AlivIACare/src/screens/paciente/`.
