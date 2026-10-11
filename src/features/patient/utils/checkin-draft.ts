import type { CheckinDraft } from '@/features/patient/utils/checkin';

/** MOB-22 · Borrador del check-in válido durante 2 h. */
export const CHECKIN_DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

export type StoredCheckinDraft = {
  savedAt: string;
  step: number;
  draft: CheckinDraft;
};

export function checkinDraftKey(userId: string) {
  return `@alivia/checkin-draft/v1/${userId}`;
}

export function isDraftFresh(savedAt: string, nowMs: number = Date.now()): boolean {
  const t = Date.parse(savedAt);
  if (Number.isNaN(t)) return false;
  return nowMs - t <= CHECKIN_DRAFT_TTL_MS;
}

export function parseStoredDraft(raw: string | null): StoredCheckinDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCheckinDraft;
    if (!parsed?.savedAt || typeof parsed.step !== 'number' || !parsed.draft) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Borrador reutilizable solo si sigue dentro de la ventana de 2 h. */
export function loadFreshDraft(
  raw: string | null,
  nowMs: number = Date.now(),
): StoredCheckinDraft | null {
  const stored = parseStoredDraft(raw);
  if (!stored || !isDraftFresh(stored.savedAt, nowMs)) return null;
  return stored;
}

export function hasDraftProgress(draft: CheckinDraft, initialStep: number): boolean {
  if (initialStep > 0) return true;
  return (
    draft.emergency !== null ||
    draft.registrant !== null ||
    draft.pain !== 5 ||
    draft.zones.length > 0 ||
    draft.painSites.length > 0 ||
    Boolean(draft.mood || draft.sleep.trim()) ||
    draft.adverseNote.trim().length > 0 ||
    draft.nausea ||
    draft.vomiting ||
    draft.reflux ||
    draft.bowel.trim().length > 0 ||
    draft.appetite !== 'normal' ||
    draft.reliefSel.length > 0 ||
    draft.triggerSel.length > 0
  );
}

export function serializeDraft(step: number, draft: CheckinDraft, at: string): string {
  return JSON.stringify({ savedAt: at, step, draft } satisfies StoredCheckinDraft);
}
