import { describe, expect, it } from 'vitest';
import type { Medication } from '@/features/patient/types';
import { activeMedications, medicationDetail, medicationTitle } from '@/features/patient/utils/medications';
import { DEMO_BOOTSTRAP } from '@/shared/mocks/patient.mock';

const base: Medication = {
  id: 'x',
  name: 'Paracetamol',
  concentration: '500 mg',
  form: 'Comprimido',
  quantity: '1 comprimido',
  route: 'Oral',
  frequency: 'Cada 8 horas',
  duration: '30 días',
  status: 'activo',
};

describe('medications', () => {
  it('activeMedications excluye suspendidos y finalizados', () => {
    const meds: Medication[] = [
      base,
      { ...base, id: 'y', status: 'suspendido' },
      { ...base, id: 'z', status: 'finalizado' },
    ];
    expect(activeMedications(meds).map((m) => m.id)).toEqual(['x']);
  });

  it('activeMedications con lista vacía devuelve vacío', () => {
    expect(activeMedications([])).toEqual([]);
  });

  it('medicationTitle une nombre y concentración', () => {
    expect(medicationTitle(base)).toBe('Paracetamol 500 mg');
    expect(medicationTitle({ name: 'Té', concentration: '' })).toBe('Té');
  });

  it('medicationDetail omite campos vacíos', () => {
    expect(medicationDetail(base)).toBe('Comprimido · 1 comprimido · Oral · Cada 8 horas · 30 días');
    expect(medicationDetail({ ...base, duration: '', form: '' })).toBe('1 comprimido · Oral · Cada 8 horas');
  });

  it('fixture demo incluye al menos un medicamento no activo que el check-in no muestra', () => {
    const all = DEMO_BOOTSTRAP.medications;
    expect(activeMedications(all).length).toBeLessThan(all.length);
  });
});
