# AlivIA para celular (AliviaParaCel)

App móvil del **portal paciente de AlivIA**, construida con Expo y React Native. Es la versión para celular de [AlivIACare](../AlivIACare) (la plataforma web), pensada para que las personas con dolor crónico registren cómo están desde el teléfono, en pocos toques y sin depender del computador.

> **Estado actual: beta solo paciente, con datos de prueba (mocks) locales.** La app todavía no se conecta a AlivIACare ni guarda información real.

## Objetivo del proyecto

AlivIA acompaña a personas con **dolor crónico en Chile** y a sus equipos de salud. La web AlivIACare cubre al paciente, al médico y a la clínica; AliviaParaCel lleva **la parte del paciente** al lugar donde realmente ocurre el día a día: el celular.

El objetivo es que el paciente pueda:

1. **Registrar su bienestar diario** — dolor, síntomas y medicación — mediante un check-in guiado por pasos, corto y sin fricción.
2. **Ver su historial y la orientación de su equipo**, para entender su evolución y seguir las indicaciones.
3. **Comunicarse con AlivIA** (y con su médico cuando el canal esté habilitado) y acceder a contenido de comunidad.

Esos registros son los que, en una fase posterior, alimentarán a AlivIACare para que el equipo clínico tenga datos frecuentes y confiables entre consultas.

### Para quién

Personas con dolor crónico y sus cuidadores. Muchas usan el teléfono **con una sola mano**, tienen **baja visión** o **poca confianza con la tecnología**, y los días de más dolor tienen poca energía para formularios largos. Por eso la accesibilidad no es un extra: es una condición de seguridad.

### Principios de diseño

- **Calma por defecto**: una acción principal por pantalla.
- **Clínico, no "wellness" genérico**: lenguaje adulto, sin frases motivacionales vacías.
- **Accesible es seguro**: objetivo WCAG 2.2 AA en móvil, áreas táctiles de 44/48 px y etiquetas visibles.
- **Usuario nuevo limpio**: si alguien no tiene historial, se muestra un estado vacío honesto, nunca datos inventados.
- **Identidad por RUT chileno** y textos en español latinoamericano.
- El paciente **no** ve notas clínicas internas del equipo.

Detalle completo en [PRODUCT.md](./PRODUCT.md) y [DESIGN.md](./DESIGN.md).

## Qué incluye la beta

- **Ingreso por RUT y contraseña** (validados contra los fixtures) o modo demo.
- Cuatro pestañas: **Diario**, **AlivIA**, **Comunidad** y **Perfil**.
- **Check-in en 7 pasos** desde Diario.
- Datos de prueba editables en `src/shared/mocks/`.

### Usuarios de prueba

| Perfil | RUT | Contraseña | Para qué sirve |
| --- | --- | --- | --- |
| Demo (Constanza) | `9.876.543-3` o botón "Entrar en modo demo" | `alivia-demo` | Ver la app con historial y datos de ejemplo |
| Paciente nuevo | `15.234.678-6` | `alivia-nueva` | Ver la experiencia de alguien sin registros |

El botón "Entrar en modo demo" no pide contraseña. Cerrar sesión borra el token del dispositivo: al reabrir la app no queda la sesión ni los datos en pantalla de quien salió.

### Fuera de alcance por ahora

Conexión real a la API de AlivIACare (Prisma), vistas de médico, clínica y administración, exportación FHIR/PDF, integración con OpenAI y publicación en tiendas (EAS production).

## Cómo ejecutarla

Requisitos: Node.js y npm. Para probar en el teléfono, la app **[Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)** (SDK 57, la de Play Store). La SDK 58 sigue en beta y no se usa.

```bash
npm install
npm run dev
```

En Windows con PowerShell usa `npm.cmd` en lugar de `npm` (por ejemplo `npm.cmd run dev`), porque la política de ejecución bloquea `npm.ps1`.

`npm run dev` levanta Metro en el puerto **8083**, configura `adb` y deja activo `adb reverse` si hay un Android conectado por USB.

Para abrir la app en el teléfono, cualquiera de estas opciones:

- **USB**: con Metro corriendo, en otra terminal ejecuta `npm run open:android`.
- **Wi‑Fi**: escanea el código QR de la terminal con Expo Go (PC y teléfono en la misma red).
- **Manual**: en Expo Go, "Enter URL" → `exp://127.0.0.1:8083` (requiere USB).
- **Redes restrictivas**: `npm run dev:tunnel` y escanea el QR.

En la terminal de Metro, `w` abre la versión web. Evita la tecla `a`: si Expo Go no está instalado, intenta descargarlo y suele fallar con `TypeError: fetch failed`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Metro en el puerto 8083 con `adb` configurado |
| `npm run dev:tunnel` | Igual, pero con túnel de Expo |
| `npm run open:android` | Abre el proyecto en Expo Go por USB |
| `npm start` | Metro estándar de Expo |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias con Vitest (RUT y `patientApi`) |
| `npm run test:e2e` | Pruebas de humo con Playwright sobre la versión web |
| `npm run test:e2e:ui` | Playwright en modo interfaz |

## Estructura

```text
src/
  app/          navegación (tabs, stacks), providers y configuración
  features/
    auth/       login por RUT, contraseña y modo demo
    patient/    Diario, check-in, AlivIA, Comunidad; api/ con los mocks
    profile/    perfil del paciente
  shared/       componentes, tema de colores, validación de RUT, mocks
tests/e2e/      pruebas Playwright
scripts/        utilidades de desarrollo (Metro, adb, Expo Go)
```

Cada `src/features/*/api/` es el punto donde los mocks se reemplazarán por llamadas reales a AlivIACare.

## Próximos pasos

1. Conectar la API de AlivIACare (autenticación por RUT y check-ins reales).
2. Persistencia local y uso sin conexión para registrar aunque no haya señal.
3. Builds de desarrollo y producción con EAS.

## Para colaboradores y agentes de IA

Las convenciones del proyecto están en [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md), [DESIGN.md](./DESIGN.md) y `.cursor/skills/alivia-movil/`. La web de referencia (solo lectura) está en `../AlivIACare/src/screens/paciente/`.
