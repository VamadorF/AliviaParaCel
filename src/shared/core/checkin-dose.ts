// Generado: no editar

/** Tipos compartidos del registro de dosis (PAC 03). */

export type DoseTakenKind = 'igual' | 'mayor' | 'menor' | 'ninguna';
export type DoseReasonKind = '' | 'sos' | 'falta' | 'tolerancia' | 'olvido' | 'otro';

export interface CheckInDose {
  med: string;
  dose: string;
  indicated: string;
  taken: DoseTakenKind;
  amount: string;
  reason: DoseReasonKind;
  reasonText: string;
}

export function medIndicatedLabel(m: { quantity: string; route: string; freq: string }): string {
  return [m.quantity, m.route, m.freq].filter(Boolean).join(' · ');
}

export function medsTakenFromDoses(doses: CheckInDose[]): string[] {
  return doses.filter((d) => d.taken !== 'ninguna').map((d) => d.med);
}

export const DOSE_TAKEN_LABEL: Record<DoseTakenKind, string> = {
  igual: 'Lo indicado',
  mayor: 'Más',
  menor: 'Menos',
  ninguna: 'No tomé',
};

export const DOSE_REASON_LABEL: Record<Exclude<DoseReasonKind, ''>, string> = {
  sos: 'Uso SOS',
  falta: 'Falta de medicamento',
  tolerancia: 'Efecto o tolerancia',
  olvido: 'Olvido',
  otro: 'Otro',
};

export function doseNeedsReason(taken: DoseTakenKind): boolean {
  return taken !== 'igual';
}

export function allowedReasons(taken: DoseTakenKind): DoseReasonKind[] {
  if (taken === 'igual') return [];
  if (taken === 'mayor') return ['sos', 'tolerancia', 'otro'];
  if (taken === 'menor' || taken === 'ninguna') return ['falta', 'tolerancia', 'olvido', 'otro'];
  return [];
}

export interface DoseAlertDraft { source: string; severity: string; detail: string }

/** Hasta dos alertas bajas por diferencias de dosis (PAC 03). */
export function doseAlerts(doses: CheckInDose[], adverseNote: string): DoseAlertDraft[] {
  const note = adverseNote.trim();
  const noteSuffix = note ? ` Nota del paciente: ${note}` : '';
  const diffs = doses.filter((d) => d.taken !== 'igual');
  const hasFalta = diffs.some((d) => d.reason === 'falta');
  const out: DoseAlertDraft[] = [];
  if (hasFalta) {
    out.push({
      source: 'escasez',
      severity: 'baja',
      detail: 'Paciente reporta falta de medicamento. Evaluar resurtir receta, citar o contactar.' + noteSuffix,
    });
  }
  const other = diffs.filter((d) => d.reason !== 'falta');
  if (other.length) {
    const lines = other.map((d) => {
      const r = d.reason && d.reason !== 'otro' ? DOSE_REASON_LABEL[d.reason] : d.reasonText.trim() || 'motivo no indicado';
      return `${d.med}: ${DOSE_TAKEN_LABEL[d.taken]} (indicado ${d.indicated}) — ${r}`;
    });
    out.push({ source: 'dosis', severity: 'baja', detail: lines.join('; ') + noteSuffix });
  } else if (note && !out.length) {
    out.push({ source: 'dosis', severity: 'baja', detail: 'Consulta por posible efecto adverso: ' + note });
  }
  return out.slice(0, 2);
}

export function percentTakenFromDose(taken: DoseTakenKind): number {
  if (taken === 'ninguna') return 0;
  if (taken === 'menor') return 50;
  return 100;
}

/** Espejo numérico para MedAdherence (sprint 0) derivado de dosis PAC 03. */
export function medsDetailFromDoses(doses: CheckInDose[]): { name: string; percentTaken: number; adverseNotes: string }[] {
  return doses.map((d) => ({
    name: d.med,
    percentTaken: percentTakenFromDose(d.taken),
    adverseNotes: d.reason === 'otro' ? d.reasonText.trim() : d.reason ? DOSE_REASON_LABEL[d.reason] : '',
  }));
}

/** Dosis esperadas por día a partir del texto de frecuencia (receta MINSAL). */
export function takesPerDay(freq: string): number {
  const f = (freq ?? '').toLowerCase();
  const cada = f.match(/cada\s*(\d+)\s*h/);
  if (cada) {
    const h = parseInt(cada[1], 10);
    if (h > 0 && h <= 24) return Math.max(1, Math.round(24 / h));
  }
  const veces = f.match(/(\d+)\s*veces/);
  if (veces) return Math.max(1, parseInt(veces[1], 10));
  if (/cada\s*12/.test(f)) return 2;
  if (/cada\s*8/.test(f)) return 3;
  if (/cada\s*6/.test(f)) return 4;
  if (/cada\s*24|1\s*vez|una vez|diario|al d[ií]a|noche/i.test(f)) return 1;
  return 1;
}

export interface MedAdherenceRow {
  med: string;
  freq: string;
  takesPerDay: number;
  expectedDoses: number;
  takenDoses: number;
  percent: number;
}

export interface DoseAdherenceResult {
  periodDays: number;
  overallPercent: number;
  perMed: MedAdherenceRow[];
  /** Toma extra (más de lo indicado) en el período */
  extraTaken: number;
  /** Detalle legible de la fórmula */
  formula: string;
}

type AdherenceCheckIn = { createdAt: string; doses: CheckInDose[] };
type AdherenceMed = { name: string; freq: string; status: string };

/** Adherencia estructurada: tomas registradas vs indicadas en N días calendario. */
export function doseAdherence(checkIns: AdherenceCheckIn[], meds: AdherenceMed[], periodDays: number): DoseAdherenceResult {
  const active = meds.filter((m) => m.status === 'activo');
  if (!active.length) {
    return { periodDays, overallPercent: 0, perMed: [], extraTaken: 0, formula: 'Sin medicamentos activos' };
  }
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (periodDays - 1));
  const inPeriod = checkIns.filter((c) => new Date(c.createdAt) >= cutoff);
  let extraTaken = 0;
  const perMed: MedAdherenceRow[] = active.map((m) => {
    const tpd = takesPerDay(m.freq);
    const expectedDoses = periodDays * tpd;
    let takenDoses = 0;
    for (const c of inPeriod) {
      for (const d of c.doses) {
        if (d.med !== m.name) continue;
        if (d.taken === 'ninguna') continue;
        if (d.taken === 'mayor') {
          takenDoses += 1;
          extraTaken += 1;
        } else if (d.taken === 'menor') takenDoses += 0.5;
        else takenDoses += 1;
      }
    }
    const percent = expectedDoses ? Math.min(100, Math.round((takenDoses / expectedDoses) * 100)) : 0;
    return { med: m.name, freq: m.freq, takesPerDay: tpd, expectedDoses, takenDoses: Math.round(takenDoses * 10) / 10, percent };
  });
  const totalExpected = perMed.reduce((a, r) => a + r.expectedDoses, 0);
  const totalTaken = perMed.reduce((a, r) => a + r.takenDoses, 0);
  const overallPercent = totalExpected ? Math.round((totalTaken / totalExpected) * 100) : 0;
  const formula =
    `${periodDays} días × ${active.length} medicamento(s) activo(s): ${totalTaken.toFixed(1)} tomas registradas / ${totalExpected} esperadas = ${overallPercent}%`;
  return { periodDays, overallPercent, perMed, extraTaken, formula };
}

export function validateDoses(doses: CheckInDose[]): string | null {
  for (const d of doses) {
    if (!doseNeedsReason(d.taken)) continue;
    if (!d.reason) return `Falta el motivo de ${d.med}`;
    if (!allowedReasons(d.taken).includes(d.reason)) return `Motivo no válido para ${d.med}`;
    if (d.reason === 'otro' && !d.reasonText.trim()) return `Describe el motivo de ${d.med}`;
  }
  return null;
}
