# DESIGN.md — AlivIA móvil

## Color

| Token | Valor | Uso |
| --- | --- | --- |
| background | `#eef1ec` | Fondo app |
| surface | `#ffffff` | Tarjetas |
| primary | `#256e4d` | CTA, nav activo |
| text | `#16211c` | Títulos y cuerpo |
| textMuted | `#71807a` | Meta |
| border | `#e7ebe7` | Bordes |
| danger | `#b03a44` | Crisis, logout |
| warning | `#e08a2f` | Pendiente |
| accent | `#4f5bc0` | Instrucción equipo |

Contraste texto normal ≥ 4.5:1; UI ≥ 3:1.

## Type

- Título pantalla: 24–28 / 800
- Cuerpo: 16 / 400–600
- Meta: 12–13 / 600–800, letter-spacing en etiquetas de sección
- `allowFontScaling` siempre; sin alturas fijas que recorten texto

## Shape

- Radio tarjetas: 20
- Radio botones: 14
- Radio chips: 12
- Nav inferior fija, 4 tabs con **texto** (Diario, AlivIA, Comunidad, Perfil)

## Bans (anti-slop)

- Beige/lila AI, gradientes decorativos, glassmorphism
- Italic serif, emojis como UI, puntos pulsantes
- Cards dentro de cards, dashboards de KPI gigantes
- Placeholder como único label
- Dolor comunicado **solo** por color

## Patterns

- Check-in por **pasos** con “Paso N de M”
- Errores: “Falta: …” accionable
- Crisis (131) visualmente distinto del CTA “Guardar registro”
- Banner: “BETA · datos de demostración”

## Figma

- Archivo de diseño: ver [design/FIGMA.md](./design/FIGMA.md).
- Tokens importables: [design/figma-tokens.json](./design/figma-tokens.json) (Tokens Studio / Variables).
- Viewport de referencia **390×844** (mismo que `tests/e2e` con Playwright).
- **URL del archivo Figma (equipo):** _pendiente — pegar en FIGMA.md y aquí cuando exista._

## Accessibility checklist (antes de cerrar una pantalla)

- [ ] Un H1, un CTA primario
- [ ] Controles ≥ 48dp alto; iconos con `accessibilityLabel`
- [ ] Focus/pressed visible en `Pressable`
- [ ] Live region en confirmación de guardado
