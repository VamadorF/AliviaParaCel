/**
 * DIF-03 · Pasos opcionales de alivios y gatillantes del check-in móvil.
 * Las reglas de visibilidad son las mismas que la web (`AlivIACare/src/data/checkin-steps.ts`, DIF-02).
 */
import {
  OTHER_ID,
  RELIEF_CATALOG,
  TRIGGER_CATALOG,
  suggestionsForPathology,
} from '@/shared/data/trigger-catalog';
import type { CatalogItem } from '@/shared/data/trigger-catalog';
import type { CheckInRecord } from '@/features/patient/types';

export interface ReliefTriggerVisibilityInput {
  pain: number;
  /** Dolor del registro anterior (del día o el último conocido); null si no hay. */
  previousPain: number | null;
  /** true si este es el primer check-in del día. */
  firstOfDay: boolean;
}

/**
 * Los pasos opcionales se muestran si dolor ≥ 4, o |Δ| ≥ 2 contra el registro anterior,
 * y siempre en el primer check-in del día. Omitirlos nunca bloquea el guardado.
 */
export function showReliefTriggerSteps({ pain, previousPain, firstOfDay }: ReliefTriggerVisibilityInput): boolean {
  if (firstOfDay) return true;
  if (pain >= 4) return true;
  return previousPain !== null && Math.abs(pain - previousPain) >= 2;
}

function instantOf(c: CheckInRecord): string {
  if (c.createdAt) return c.createdAt;
  return `${c.date}T${c.time}`;
}

/**
 * Contexto de visibilidad a partir de los registros guardados.
 * "Hoy" usa la misma fecha con que se guarda el registro (`buildCheckInRecord`).
 */
export function attributionContext(
  checkIns: readonly CheckInRecord[],
  now: Date,
): { previousPain: number | null; firstOfDay: boolean } {
  const today = now.toISOString().slice(0, 10);
  const sorted = [...checkIns].sort((a, b) => instantOf(a).localeCompare(instantOf(b)));
  const todays = sorted.filter((c) => c.date === today);
  const last = todays.length ? todays[todays.length - 1] : sorted[sorted.length - 1];
  return { previousPain: last ? last.pain : null, firstOfDay: todays.length === 0 };
}

export interface AttributionOption extends CatalogItem {
  suggested: boolean;
}

function withSuggestions(catalog: CatalogItem[], suggestedIds: string[]): AttributionOption[] {
  const suggested = suggestedIds
    .map((id) => catalog.find((c) => c.id === id))
    .filter((c): c is CatalogItem => !!c)
    .map((c) => ({ ...c, suggested: true }));
  const rest = catalog.filter((c) => !suggestedIds.includes(c.id)).map((c) => ({ ...c, suggested: false }));
  return [...suggested, ...rest, { id: OTHER_ID, label: 'Otro', suggested: false }];
}

/** Alivios del catálogo v1.0: sugeridos primero y "Otro" al final. */
export function reliefOptions(pathology = ''): AttributionOption[] {
  return withSuggestions(RELIEF_CATALOG, suggestionsForPathology(pathology).reliefs);
}

/** Gatillantes del catálogo v1.0: sugeridos primero y "Otro" al final. */
export function triggerOptions(pathology = ''): AttributionOption[] {
  return withSuggestions(TRIGGER_CATALOG, suggestionsForPathology(pathology).triggers);
}
