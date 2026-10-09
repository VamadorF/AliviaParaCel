import type { Medication } from '@/features/patient/types';

/** Invariante #17: el check-in solo muestra medicamentos activos. */
export function activeMedications(meds: Medication[]): Medication[] {
  return meds.filter((m) => m.status === 'activo');
}

/** "Paracetamol 500 mg" */
export function medicationTitle(m: Pick<Medication, 'name' | 'concentration'>): string {
  return [m.name, m.concentration].filter(Boolean).join(' ');
}

/** "Comprimido · 1 comprimido · Oral · Cada 8 horas · 30 días" */
export function medicationDetail(m: Medication): string {
  return [m.form, m.quantity, m.route, m.frequency, m.duration].filter(Boolean).join(' · ');
}
