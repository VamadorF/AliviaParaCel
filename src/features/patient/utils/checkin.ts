import {
  allowedReasons,
  doseNeedsReason,
  medIndicatedLabel,
  medsDetailFromDoses,
  medsTakenFromDoses,
  validateDoses,
} from '@/shared/core/checkin-dose';
import type { CheckInDose, DoseTakenKind } from '@/shared/core/checkin-dose';
import type { CheckInNotes, CheckInRow, GiDetail } from '@/shared/core/checkin-row';
import { lastCaregiver } from '@/shared/core/derived-patient';
import type { CheckInRecord, DoseChoice, Medication } from '@/features/patient/types';

/** Pasos del check-in (MOB-04). El último es el resumen. */
export const CHECKIN_STEPS = 8;
export const STEP = {
  urgencias: 0,
  quien: 1,
  dolor: 2,
  zonas: 3,
  animo: 4,
  medicamentos: 5,
  digestivo: 6,
  resumen: 7,
} as const;

export type Registrant = 'self' | 'caregiver';
export type Appetite = NonNullable<GiDetail['appetite']>;

export type CheckinDraft = {
  emergency: boolean | null;
  emergencyReason: string;
  emergencyDetail: string;
  registrant: Registrant | null;
  caregiverName: string;
  caregiverRelation: string;
  pain: number;
  zones: string[];
  mood: string;
  sleep: string;
  notes: CheckInNotes;
  /** Dosis por id de medicamento activo. */
  doses: Record<string, CheckInDose>;
  adverseNote: string;
  nausea: boolean;
  vomiting: boolean;
  /** Texto: solo dígitos, máximo 2. Vacío = no reporta. */
  bowel: string;
  appetite: Appetite;
  reflux: boolean;
};

export const EMPTY_NOTES: CheckInNotes = { zones: '', mood: '', sleep: '' };

export const APPETITE_LABEL: Record<Appetite, string> = {
  normal: 'Normal',
  reducido: 'Reducido',
  nulo: 'Sin apetito',
};

export const TAKEN_OPTIONS: DoseTakenKind[] = ['igual', 'mayor', 'menor', 'ninguna'];

const CHOICE_BY_TAKEN: Record<DoseTakenKind, DoseChoice> = {
  igual: 'indicated',
  mayor: 'more',
  menor: 'less',
  ninguna: 'skipped',
};

/** Dosis inicial del formulario: "lo indicado", sin motivo. */
export function emptyDose(m: Medication): CheckInDose {
  return {
    med: m.name,
    dose: m.concentration,
    indicated: medIndicatedLabel({ quantity: m.quantity, route: m.route, freq: m.frequency }),
    taken: 'igual',
    amount: '',
    reason: '',
    reasonText: '',
  };
}

/** Cambia una dosis y deja el motivo coherente (misma regla que la web). */
export function patchDose(prev: CheckInDose, patch: Partial<CheckInDose>): CheckInDose {
  const next = { ...prev, ...patch };
  if (patch.taken && !doseNeedsReason(patch.taken)) {
    next.reason = '';
    next.reasonText = '';
    next.amount = '';
  }
  if (patch.taken && patch.taken !== prev.taken) {
    if (next.reason && !allowedReasons(patch.taken).includes(next.reason)) next.reason = '';
  }
  if (patch.reason !== undefined && patch.reason !== 'otro') next.reasonText = '';
  return next;
}

export function initialDraft(
  medications: Medication[],
  caregiver: { name: string; relation: string } | null,
): CheckinDraft {
  return {
    emergency: null,
    emergencyReason: '',
    emergencyDetail: '',
    registrant: null,
    caregiverName: caregiver?.name ?? '',
    caregiverRelation: caregiver?.relation ?? '',
    pain: 5,
    zones: [],
    mood: '',
    sleep: '',
    notes: { ...EMPTY_NOTES },
    doses: Object.fromEntries(medications.map((m) => [m.id, emptyDose(m)])),
    adverseNote: '',
    nausea: false,
    vomiting: false,
    bowel: '',
    appetite: 'normal',
    reflux: false,
  };
}

/** Solo dígitos y máximo 2 (deposiciones 0–99). */
export function sanitizeBowel(text: string): string {
  return text.replace(/\D/g, '').slice(0, 2);
}

function dosesInOrder(draft: CheckinDraft, medications: Medication[]): CheckInDose[] {
  return medications.map((m) => draft.doses[m.id] ?? emptyDose(m));
}

/**
 * Campos que faltan en un paso, con los mismos textos que la web ("Falta: …").
 * Los pasos sin obligatorios devuelven [].
 */
export function stepMissing(step: number, draft: CheckinDraft, medications: Medication[]): string[] {
  const out: string[] = [];
  if (step === STEP.urgencias) {
    if (draft.emergency === null) out.push('urgencias');
    else if (draft.emergency && (!draft.emergencyReason.trim() || !draft.emergencyDetail.trim())) {
      out.push('datos de urgencias');
    }
  }
  if (step === STEP.quien) {
    if (draft.registrant === null) out.push('quién registra');
    if (draft.registrant === 'caregiver') {
      if (!draft.caregiverName.trim()) out.push('nombre del cuidador');
      if (!draft.caregiverRelation.trim()) out.push('relación del cuidador');
    }
  }
  if (step === STEP.zonas && draft.zones.length === 0) out.push('al menos una zona');
  if (step === STEP.medicamentos && medications.length > 0) {
    const err = validateDoses(dosesInOrder(draft, medications));
    if (err) out.push(err.replace(/^Falta /, '').replace(/^Describe /, ''));
  }
  return out;
}

/** Todo lo que falta, en el orden de los pasos. */
export function allMissing(draft: CheckinDraft, medications: Medication[]): string[] {
  return Array.from({ length: CHECKIN_STEPS }, (_, i) => stepMissing(i, draft, medications)).flat();
}

export function parseBowel(bowel: string): number | null {
  const raw = bowel.trim();
  return raw === '' ? null : Math.max(0, parseInt(raw, 10) || 0);
}

export function draftGiDetail(draft: CheckinDraft): GiDetail {
  return {
    nausea: draft.nausea,
    vomiting: draft.vomiting,
    bowelMovements: parseBowel(draft.bowel),
    appetite: draft.appetite,
    reflux: draft.reflux,
  };
}

/** Resumen digestivo para la pantalla final; null si no hay nada que destacar. */
export function giSummary(draft: CheckinDraft): string | null {
  const parts: string[] = [];
  if (draft.nausea) parts.push('náuseas');
  if (draft.vomiting) parts.push('vómitos');
  const bowel = parseBowel(draft.bowel);
  if (bowel !== null) parts.push(bowel === 0 ? 'sin deposiciones' : `${bowel} deposición(es)`);
  if (draft.appetite !== 'normal') parts.push(`apetito ${draft.appetite}`);
  if (draft.reflux) parts.push('reflujo o acidez');
  return parts.length ? parts.join(', ') : null;
}

/** Arma el registro a guardar. Los campos del cuidador y de urgencias solo van si aplican. */
export function buildCheckInRecord(
  draft: CheckinDraft,
  medications: Medication[],
  now: Date,
  id: string,
): CheckInRecord | null {
  if (draft.emergency === null || draft.registrant === null) return null;
  const doseDetails = dosesInOrder(draft, medications).map((d) => ({
    ...d,
    amount: d.amount.trim(),
    reasonText: d.reasonText.trim(),
  }));
  const caregiver = draft.registrant === 'caregiver';
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
    registrant: draft.registrant,
    caregiverName: caregiver ? draft.caregiverName.trim() : '',
    caregiverRelation: caregiver ? draft.caregiverRelation.trim() : '',
    doses: medications.map((m, i) => ({ medId: m.id, choice: CHOICE_BY_TAKEN[doseDetails[i].taken] })),
    doseDetails,
    adverseNote: draft.adverseNote.trim(),
    giDetail: draftGiDetail(draft),
    notes: {
      zones: draft.notes.zones.trim(),
      mood: draft.notes.mood.trim(),
      sleep: draft.notes.sleep.trim(),
    },
  };
}

function createdAtOf(record: CheckInRecord): string {
  if (record.createdAt) return record.createdAt;
  const parsed = new Date(`${record.date}T${record.time}:00`);
  return Number.isNaN(parsed.getTime()) ? `${record.date}T00:00:00.000Z` : parsed.toISOString();
}

/** El registro del móvil con la forma exacta de un `CheckInRow` de la web. */
export function toCheckInRow(record: CheckInRecord, patientRut: string): CheckInRow {
  const doses = record.doseDetails ?? [];
  const gi = record.giDetail ?? {};
  const caregiver = record.registrant === 'caregiver';
  return {
    patientRut,
    time: record.time,
    pain: record.pain,
    zones: record.zones,
    mood: record.mood ?? '',
    sleep: record.sleep ?? '',
    why: record.why ?? [],
    medsTaken: medsTakenFromDoses(doses),
    medsDetail: medsDetailFromDoses(doses),
    notes: record.notes ?? { ...EMPTY_NOTES },
    doses,
    adverseNote: record.adverseNote ?? '',
    nausea: gi.nausea ?? false,
    vomiting: gi.vomiting ?? false,
    bowelMovements: gi.bowelMovements ?? null,
    giDetail: gi,
    erVisit: record.emergency,
    erReason: record.emergencyReason ?? '',
    erDetail: record.emergencyDetail ?? '',
    reportedBy: caregiver ? 'cuidador' : 'paciente',
    caregiverName: caregiver ? (record.caregiverName ?? '') : '',
    caregiverRelation: caregiver ? (record.caregiverRelation ?? '') : '',
    createdAt: createdAtOf(record),
  };
}

/** Último cuidador registrado, con la misma regla de la web (`lastCaregiver`). */
export function lastCaregiverOf(
  checkIns: CheckInRecord[],
  patientRut: string,
): { name: string; relation: string } | null {
  const rows = checkIns
    .map((c) => toCheckInRow(c, patientRut))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return lastCaregiver(rows, patientRut);
}
