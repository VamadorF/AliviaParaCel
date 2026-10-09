# Figma — AlivIA móvil (paciente)

Fuente de verdad compartida: código (`DESIGN.md`, `src/shared/theme/colors.ts`) ↔ Figma.

## 1. Crear el archivo

1. En [Figma](https://www.figma.com/), archivo nuevo: **AlivIA · Móvil · Paciente (beta)**.
2. Frame base **390 × 844** (iPhone 14 / Pixel 5 — mismo viewport que Playwright).
3. Página **00 · Tokens** — variables de color, radio y spacing.
4. Página **01 · Flujos** — Login, Diario, Check-in (paso 1 y 7), AlivIA, Comunidad, Perfil, Tab bar.

## 2. Importar tokens

Con el plugin **Tokens Studio for Figma** (o Variables nativas):

1. Import → JSON → [`figma-tokens.json`](./figma-tokens.json).
2. Aplicar set `alivia/mobile/light` a los frames.
3. Tras cambios en código, re-exportar desde Tokens Studio o actualizar `figma-tokens.json` y volver a importar.

## 3. Componentes mínimos en Figma

| Componente | Notas |
| --- | --- |
| Button / Primary | 48px alto, radio 14, `#256e4d` |
| Button / Ghost | borde primary |
| Chip | 44px min alto, radio 12 |
| Card | radio 20, borde `#e7ebe7` |
| Beta banner | `#e6f2ec`, texto 12 / 800 |
| Tab bar | 4 items con label (no icon-only) |

## 4. Enlace del equipo

Pega la URL del archivo aquí y en `DESIGN.md` → sección Figma:

```
https://www.figma.com/design/TU_FILE_ID/AlivIA-Movil
```

## 5. QA visual

Tras cambios de UI, comparar capturas de Playwright (`npm run test:e2e`) con los frames de Figma (Diario + Check-in).

Referencia web (handoff histórico): `../AlivIACare/design_handoff_alivia_core/` — colores alineados con `#256e4d` / `#eef1ec`.
