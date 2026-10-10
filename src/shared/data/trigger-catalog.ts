/**
 * DIF-01 · Espejo del catálogo web (`AlivIACare/src/data/checkin-catalog.ts`).
 * Los `triggers` guardan ids estables; los alivios usan `action` = id del catálogo.
 */
export type ReliefLevel = 'nada' | 'algo' | 'mucho';
export type ReliefAction = { action: string; relief: ReliefLevel; text?: string };

export const CATALOG_VERSION = '1.0';
export const OTHER_ID = 'otro';
export const OTHER_PREFIX = 'otro:';

export interface CatalogItem {
  id: string;
  label: string;
}

export const TRIGGER_CATALOG: CatalogItem[] = [
  { id: 'estres', label: 'Estrés' },
  { id: 'mala-noche', label: 'Mala noche' },
  { id: 'cambio-clima', label: 'Cambio de clima' },
  { id: 'sobreesfuerzo', label: 'Sobreesfuerzo' },
  { id: 'postura', label: 'Postura prolongada' },
  { id: 'frio', label: 'Frío' },
  { id: 'comida', label: 'Alimentos o comidas' },
  { id: 'pantallas', label: 'Pantallas o luz intensa' },
  { id: 'omiti-medicacion', label: 'Omití mi medicación' },
  { id: 'ciclo-hormonal', label: 'Ciclo hormonal' },
];

export const RELIEF_CATALOG: CatalogItem[] = [
  { id: 'medicacion', label: 'Tomé mi medicación' },
  { id: 'descanso', label: 'Descansé mejor' },
  { id: 'ejercicio-suave', label: 'Ejercicio suave' },
  { id: 'calor-frio', label: 'Calor o frío local' },
  { id: 'respiracion', label: 'Respiración o relajación' },
  { id: 'estiramientos', label: 'Estiramientos' },
  { id: 'masaje', label: 'Masaje' },
  { id: 'cuarto-oscuro', label: 'Cuarto oscuro y silencio' },
  { id: 'hidratacion', label: 'Hidratación' },
];

export const RELIEF_LEVELS: readonly ReliefLevel[] = ['nada', 'algo', 'mucho'];

/** Texto visible de cada nivel (mismo que la web). */
export const RELIEF_LEVEL_LABEL: Record<ReliefLevel, string> = { nada: 'Nada', algo: 'Algo', mucho: 'Mucho' };

/** Gatillantes listos para guardar: sin vacíos, sin duplicados, "Otro" solo con texto (`otro:<texto>`). */
export function sanitizeTriggers(input: readonly string[]): string[] {
  const out: string[] = [];
  for (const v of input) {
    const t = v.trim();
    if (!t || t === OTHER_PREFIX || t === OTHER_ID) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

/** Alivios listos para guardar: nivel válido, "Otro" solo con texto, sin duplicados. */
export function sanitizeReliefActions(input: readonly ReliefAction[]): ReliefAction[] {
  const out: ReliefAction[] = [];
  for (const a of input) {
    const action = a.action.trim();
    if (!action || !RELIEF_LEVELS.includes(a.relief)) continue;
    const text = (a.text ?? '').trim();
    if (action === OTHER_ID && !text) continue;
    if (out.some((x) => x.action === action && (x.text ?? '') === text)) continue;
    out.push({ action, relief: a.relief, ...(text ? { text } : {}) });
  }
  return out;
}

export function otherTrigger(text: string): string {
  const t = text.trim();
  return t ? `${OTHER_PREFIX}${t}` : OTHER_ID;
}

export function triggerLabel(id: string): string {
  if (id.startsWith(OTHER_PREFIX)) return id.slice(OTHER_PREFIX.length).trim() || 'Otro';
  return TRIGGER_CATALOG.find((t) => t.id === id)?.label ?? id;
}

export function reliefLabel(a: ReliefAction): string {
  if (a.action === OTHER_ID) return a.text?.trim() || 'Otro';
  return RELIEF_CATALOG.find((r) => r.id === a.action)?.label ?? a.action;
}

function normalizeWhy(raw: string): string {
  return (raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const LEGACY_RULES: { match: RegExp; kind: 'trigger' | 'relief'; id: string }[] = [
  { match: /^tome mi medicacion/, kind: 'relief', id: 'medicacion' },
  { match: /^descanse mejor/, kind: 'relief', id: 'descanso' },
  { match: /^ejercicio suave/, kind: 'relief', id: 'ejercicio-suave' },
  { match: /^calor (o )?frio/, kind: 'relief', id: 'calor-frio' },
  { match: /^estres/, kind: 'trigger', id: 'estres' },
  { match: /^cambio de clima/, kind: 'trigger', id: 'cambio-clima' },
  { match: /^sobreesfuerzo/, kind: 'trigger', id: 'sobreesfuerzo' },
  { match: /^mala noche/, kind: 'trigger', id: 'mala-noche' },
];

export type WhyClassification = {
  triggers: string[];
  reliefs: string[];
  unclassified: string[];
};

/** @deprecated usar migrateWhy; mantiene forma para tests legacy */
export function classifyWhy(why: readonly string[] | undefined): WhyClassification {
  const m = migrateWhy([...(why ?? [])]);
  const unclassified: string[] = [];
  for (const w of why ?? []) {
    const n = normalizeWhy(w);
    if (!n || LEGACY_RULES.some((r) => r.match.test(n))) continue;
    if (n === 'no lo se') {
      unclassified.push('No lo sé');
      continue;
    }
    const known = m.triggers.length + m.reliefActions.length;
    if (known === 0 && w.trim()) unclassified.push(w.replace(/^[^\p{L}\p{N}]+/u, '').trim());
  }
  return {
    triggers: m.triggers,
    reliefs: m.reliefActions.map((a) => a.action),
    unclassified,
  };
}

export function migrateWhy(why: string[]): {
  triggers: string[];
  reliefActions: ReliefAction[];
  catalogVersion: string;
} {
  const triggers: string[] = [];
  const reliefActions: ReliefAction[] = [];
  for (const w of why) {
    const n = normalizeWhy(w);
    const rule = LEGACY_RULES.find((r) => r.match.test(n));
    if (!rule) continue;
    if (rule.kind === 'trigger' && !triggers.includes(rule.id)) triggers.push(rule.id);
    if (rule.kind === 'relief' && !reliefActions.some((a) => a.action === rule.id)) {
      reliefActions.push({ action: rule.id, relief: 'algo' });
    }
  }
  return { triggers, reliefActions, catalogVersion: CATALOG_VERSION };
}

export type Attributions = {
  triggers: string[];
  reliefActions: ReliefAction[];
  legacyReliefs: string[];
};

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
  const m = migrateWhy(record.why ?? []);
  return {
    triggers: m.triggers,
    reliefActions: m.reliefActions,
    legacyReliefs: [],
  };
}

export type PathologySuggestion = { triggers: string[]; reliefs: string[] };

const PATHOLOGY_SUGGESTIONS: { match: RegExp; suggestion: PathologySuggestion }[] = [
  { match: /c[áa]ncer|oncol[óo]g|tumor/, suggestion: { triggers: ['estres', 'mala-noche', 'comida'], reliefs: ['medicacion', 'descanso', 'respiracion'] } },
  { match: /fibromialgia/, suggestion: { triggers: ['estres', 'mala-noche', 'cambio-clima', 'sobreesfuerzo'], reliefs: ['ejercicio-suave', 'calor-frio', 'estiramientos', 'descanso'] } },
  { match: /migra[ñn]|cefalea/, suggestion: { triggers: ['estres', 'mala-noche', 'pantallas', 'comida', 'ciclo-hormonal'], reliefs: ['cuarto-oscuro', 'hidratacion', 'medicacion', 'respiracion'] } },
  { match: /lumbalgia|columna|espalda|hernia/, suggestion: { triggers: ['postura', 'sobreesfuerzo', 'frio'], reliefs: ['calor-frio', 'estiramientos', 'ejercicio-suave', 'masaje'] } },
  { match: /artritis|reumatoide/, suggestion: { triggers: ['frio', 'cambio-clima', 'sobreesfuerzo'], reliefs: ['calor-frio', 'ejercicio-suave', 'medicacion'] } },
];

const DEFAULT_SUGGESTION: PathologySuggestion = {
  triggers: ['estres', 'mala-noche', 'sobreesfuerzo'],
  reliefs: ['medicacion', 'descanso', 'ejercicio-suave'],
};

export function suggestionsForPathology(pathology: string): PathologySuggestion {
  const found = PATHOLOGY_SUGGESTIONS.find((p) => p.match.test(pathology.toLowerCase()));
  return found ? found.suggestion : DEFAULT_SUGGESTION;
}
