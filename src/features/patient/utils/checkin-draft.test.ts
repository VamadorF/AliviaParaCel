import { describe, expect, it } from 'vitest';
import { initialDraft } from '@/features/patient/utils/checkin';
import {
  CHECKIN_DRAFT_TTL_MS,
  hasDraftProgress,
  isDraftFresh,
  loadFreshDraft,
  serializeDraft,
} from '@/features/patient/utils/checkin-draft';

const NOW = Date.parse('2026-10-11T12:00:00.000Z');
const meds: never[] = [];

describe('MOB-22 · borrador del check-in', () => {
  it('caduca después de 2 h', () => {
    const savedAt = new Date(NOW - CHECKIN_DRAFT_TTL_MS - 1).toISOString();
    expect(isDraftFresh(savedAt, NOW)).toBe(false);
    expect(loadFreshDraft(serializeDraft(2, initialDraft(meds), savedAt), NOW)).toBeNull();
  });

  it('sigue válido dentro de 2 h', () => {
    const savedAt = new Date(NOW - CHECKIN_DRAFT_TTL_MS + 60_000).toISOString();
    const raw = serializeDraft(1, initialDraft(meds), savedAt);
    const loaded = loadFreshDraft(raw, NOW);
    expect(loaded?.step).toBe(1);
  });

  it('detecta progreso real en el borrador', () => {
    const base = initialDraft(meds);
    expect(hasDraftProgress(base, 0)).toBe(false);
    expect(hasDraftProgress({ ...base, emergency: false }, 0)).toBe(true);
  });
});
