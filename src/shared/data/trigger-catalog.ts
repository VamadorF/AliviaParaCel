/**
 * DIF-01 · Catálogo versionado de gatillantes y alivios.
 *
 * Espejo móvil del catálogo web (mismos nombres de campo en el check-in:
 * `triggers`, `reliefActions`, `catalogVersion`). Los valores guardados son las
 * etiquetas canónicas en español, igual que el `why` histórico, para que las
 * estadísticas por texto de la web y del móvil cuenten lo mismo.
 * Si cambia una etiqueta o se agrega una, subir `CATALOG_VERSION`.
 */

export const CATALOG_VERSION = '1';

/** Etiqueta de la opción libre; el texto del paciente viaja en `text`. */
export const OTHER_LABEL = 'Otro';

/** Gatillante libre: `triggers` es `string[]`, así que el texto viaja en la etiqueta. */
export function otherTrigger(text: string): string {
  const t = text.trim();
  return t ? `${OTHER_LABEL}: ${t}` : OTHER_LABEL;
}

export type ReliefLevel = 'nada' | 'algo' | 'mucho';
export type ReliefAction = { action: string; relief: ReliefLevel; text?: string };

export const RELIEF_LEVELS: readonly ReliefLevel[] = ['nada', 'algo', 'mucho'];

export const TRIGGER_CATALOG = [
  'Estrés',
  'Mala noche',
  'Sobreesfuerzo',
  'Cambio de clima',
  'Postura prolongada',
  'Comida o bebida',
  'Cambio en mi medicación',
] as const;

export const RELIEF_CATALOG = [
  'Tomé mi medicación',
  'Descansé',
  'Ejercicio suave',
  'Calor o frío local',
  'Respiración o relajación',
  'Cambié de postura',
] as const;

/** Atribuciones históricas (`why`) con emoji o variantes de redacción → etiqueta canónica. */
const LEGACY_TRIGGERS: Record<string, string> = {
  estres: 'Estrés',
  'mala noche': 'Mala noche',
  sobreesfuerzo: 'Sobreesfuerzo',
  'cambio de clima': 'Cambio de clima',
};

const LEGACY_RELIEFS: Record<string, string> = {
  'tome mi medicacion': 'Tomé mi medicación',
  'descanse mejor': 'Descansé',
  descanse: 'Descansé',
  'ejercicio suave': 'Ejercicio suave',
  'calor o frio local': 'Calor o frío local',
  'calor / frio local': 'Calor o frío local',
};

/** Minúsculas, sin tildes, sin emoji ni signos: clave estable para comparar textos libres. */
function legacyKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type WhyClassification = {
  triggers: string[];
  /** Solo el nombre: el registro antiguo no guardó cuánto alivió. */
  reliefs: string[];
  /** Lo que no es ni gatillante ni alivio (ej. "No lo sé") o no se reconoce. */
  unclassified: string[];
};

/** Reparte los `why` históricos entre gatillantes y alivios, sin duplicados y en orden. */
export function classifyWhy(why: readonly string[] | undefined): WhyClassification {
  const out: WhyClassification = { triggers: [], reliefs: [], unclassified: [] };
  for (const raw of why ?? []) {
    const key = legacyKey(raw);
    if (!key) continue;
    const trigger = LEGACY_TRIGGERS[key];
    const relief = LEGACY_RELIEFS[key];
    const bucket = trigger ? out.triggers : relief ? out.reliefs : out.unclassified;
    const label = trigger ?? relief ?? raw.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    if (!bucket.includes(label)) bucket.push(label);
  }
  return out;
}

export type Attributions = {
  triggers: string[];
  reliefActions: ReliefAction[];
  /** Alivios de registros antiguos, sin nivel de alivio. */
  legacyReliefs: string[];
};

/** Atribuciones de un check-in: campos nuevos si existen; si no, clasifica el `why` antiguo. */
export function attributionsOf(record: {
  triggers?: string[];
  reliefActions?: ReliefAction[];
  why?: string[];
}): Attributions {
  if (record.triggers !== undefined || record.reliefActions !== undefined) {
    return {
      triggers: record.triggers ?? [],
      reliefActions: record.reliefActions ?? [],
      legacyReliefs: [],
    };
  }
  const { triggers, reliefs } = classifyWhy(record.why);
  return { triggers, reliefActions: [], legacyReliefs: reliefs };
}

export type PathologySuggestion = {
  triggers: string[];
  reliefs: string[];
};

const PATHOLOGY_SUGGESTIONS: { match: RegExp; suggestion: PathologySuggestion }[] = [
  {
    match: /fibromialgia/,
    suggestion: {
      triggers: ['Mala noche', 'Estrés', 'Cambio de clima'],
      reliefs: ['Ejercicio suave', 'Calor o frío local', 'Respiración o relajación'],
    },
  },
  {
    match: /migra[ñn]|cefalea/,
    suggestion: {
      triggers: ['Estrés', 'Mala noche', 'Comida o bebida'],
      reliefs: ['Descansé', 'Respiración o relajación', 'Tomé mi medicación'],
    },
  },
  {
    match: /lumbalgia|columna|espalda|hernia/,
    suggestion: {
      triggers: ['Postura prolongada', 'Sobreesfuerzo', 'Mala noche'],
      reliefs: ['Calor o frío local', 'Cambié de postura', 'Ejercicio suave'],
    },
  },
  {
    match: /artritis|reumatoide/,
    suggestion: {
      triggers: ['Cambio de clima', 'Sobreesfuerzo', 'Mala noche'],
      reliefs: ['Calor o frío local', 'Ejercicio suave', 'Tomé mi medicación'],
    },
  },
];

const DEFAULT_SUGGESTION: PathologySuggestion = {
  triggers: ['Estrés', 'Mala noche', 'Sobreesfuerzo'],
  reliefs: ['Tomé mi medicación', 'Descansé', 'Ejercicio suave'],
};

/** Sugerencias por patología (mismo patrón que `guideCardsForPathology`); siempre del catálogo. */
export function suggestionsForPathology(pathology: string): PathologySuggestion {
  const found = PATHOLOGY_SUGGESTIONS.find((p) => p.match.test(pathology.toLowerCase()));
  return found ? found.suggestion : DEFAULT_SUGGESTION;
}
