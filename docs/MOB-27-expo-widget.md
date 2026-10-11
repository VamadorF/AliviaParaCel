# MOB-27 · Viabilidad de widget de inicio (Expo)

## Objetivo

Mostrar en la pantalla de inicio del teléfono un resumen breve (por ejemplo clima de la comuna y último dolor registrado), **sin** implementarlo en esta entrega.

## Estado en AlivIA móvil (mock)

- El clima ya vive en `weather.mock.ts` y se guarda en cada check-in como `weatherAtCapture` (comuna del paciente, sin GPS).
- La app usa **Expo SDK 57** con flujo **EAS** para builds nativos.

## Opciones en el ecosistema Expo / React Native

| Enfoque | Viabilidad | Notas |
| --- | --- | --- |
| **Widget nativo iOS (WidgetKit) + Android (App Widget)** vía config plugin / módulo nativo | Media | Expo no incluye widgets de inicio en el core. Requiere `expo prebuild`, código Swift/Kotlin o un paquete de terceros mantenido. Actualizaciones limitadas en background. |
| **Live Activities (iOS)** | Baja para clima diario | Orientado a eventos de corta duración, no a un panel permanente de clima + dolor. |
| **Atajo profundo (`alivia://`) + notificación local rica** | Alta | Ya hay deep links (`MOB-24`). Un recordatorio local podría mostrar texto fijo; no sustituye un widget visual. |
| **Solo Android con `react-native-android-widget`** (community) | Media-alta en Android, nula en iOS | Duplicaría UX entre plataformas. |

## Recomendación

1. **Corto plazo:** mantener el clima y el último registro **dentro de la app** (Diario / Progreso), como hoy con `weatherAtCapture`.
2. **Si el PO prioriza widget:** planificar un **módulo nativo** en un perfil EAS `production` aparte, con datos compartidos vía **App Group (iOS)** / `SharedPreferences` (Android) escritos al guardar el check-in; el widget solo lee ese snapshot (sin red en el widget).
3. **No usar** `expo-updates` ni JS en background como sustituto del widget: iOS no permite ejecutar React Native en la extensión del widget.

## Esfuerzo estimado (cuando se apruebe)

- **S:** diseño + contrato de datos compartidos (JSON mínimo: comuna, temperatura, EVA, fecha).
- **M:** implementación Android (un tamaño de widget).
- **M-L:** implementación iOS (WidgetKit + App Group) y revisión App Store.

## Conclusión

**Viable con desarrollo nativo adicional**; **no viable solo con APIs de Expo managed** en ambas plataformas. El mock de clima en check-in deja listo el dato que el widget leería en una fase posterior.
