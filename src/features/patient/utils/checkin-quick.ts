import type { CheckInRecord } from '@/features/patient/types';

/**
 * MOB-17 · Borrador del check-in rápido.
 * Las dosis quedan sin respuesta (`taken: null`). Nunca se precargan como "lo indicado".
 */
export type QuickDraft = {
  emergency: boolean;
  emergencyReason: string;
  emergencyDetail: string;
  /** null hasta que elija una cara o use el último registro. */
  pain: number | null;
  zones: string[];
  mood: string;
  sleep: string;
  doses: { medId: string; taken: null }[];
  /** True después de "Igual que mi último registro". */
  usingLast: boolean;
};

export function quickDraft(medications: readonly { id: string }[]): QuickDraft {
  return {
    emergency: false,
    emergencyReason: '',
    emergencyDetail: '',
    pain: null,
    zones: [],
    mood: '',
    sleep: '',
    doses: medications.map((m) => ({ medId: m.id, taken: null })),
    usingLast: false,
  };
}

/** Misma regla que el check-in largo: con `createdAt` gana; si no, fecha y hora del registro. */
function instantOf(record: CheckInRecord): string {
  if (record.createdAt) return record.createdAt;
  const parsed = new Date(`${record.date}T${record.time}:00`);
  return Number.isNaN(parsed.getTime()) ? `${record.date}T00:00:00.000Z` : parsed.toISOString();
}

/** El registro más reciente. El orden del arreglo no importa. */
export function latestCheckIn(checkIns: readonly CheckInRecord[]): CheckInRecord | null {
  if (checkIns.length === 0) return null;
  return [...checkIns].sort((a, b) => instantOf(a).localeCompare(instantOf(b))).at(-1) ?? null;
}

type LastSnapshot = Pick<CheckInRecord, 'zones' | 'mood' | 'sleep' | 'pain'>;

/**
 * Copia zonas, ánimo y sueño del último registro.
 * Si aún no hay cara elegida, también deja ese dolor para poder guardar sin otro toque.
 * No toca las dosis.
 */
export function sameAsLast(draft: QuickDraft, last: LastSnapshot | null): QuickDraft {
  if (!last) return draft;
  return {
    ...draft,
    zones: [...last.zones],
    mood: last.mood ?? '',
    sleep: last.sleep ?? '',
    pain: draft.pain === null ? last.pain : draft.pain,
    usingLast: true,
  };
}

/** Lo que impide guardar. Urgencias en "No" no pide nada más. */
export function quickMissing(draft: QuickDraft): string[] {
  const out: string[] = [];
  if (draft.pain === null) out.push('el dolor');
  if (draft.emergency && (!draft.emergencyReason.trim() || !draft.emergencyDetail.trim())) {
    out.push('datos de urgencias');
  }
  return out;
}

/**
 * Arma el registro rápido. Las dosis no viajan: no se afirmaron como tomadas ni como omitidas.
 * `quick: true` distingue este atajo del check-in por pasos.
 */
export function buildQuickCheckIn(draft: QuickDraft, now: Date, id: string): CheckInRecord | null {
  if (quickMissing(draft).length > 0 || draft.pain === null) return null;
  return {
    id,
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }),
    createdAt: now.toISOString(),
    pain: draft.pain,
    zones: draft.zones,
    mood: draft.mood || undefined,
    sleep: draft.sleep || undefined,
    emergency: draft.emergency,
    emergencyReason: draft.emergency ? draft.emergencyReason.trim() : '',
    emergencyDetail: draft.emergency ? draft.emergencyDetail.trim() : '',
    registrant: 'self',
    doses: [],
    doseDetails: [],
    quick: true,
  };
}
