import { describe, expect, it } from 'vitest';
import { validateDoses, type CheckInDose } from './checkin-dose';
import { checkInStreak, lastCaregiver } from './derived-patient';
import type { CheckInRow } from './checkin-row';
import { isValidRut, normalizeRut } from './rut';
import { painColor, painLabel } from './pain';

describe('core rut', () => {
  it('valida RUT canónico', () => {
    expect(isValidRut('9.876.543-3')).toBe(true);
    expect(normalizeRut('123456785')).toBe('12345678-5');
  });
});

describe('core pain', () => {
  it('colores alineados con la web', () => {
    expect(painColor(8)).toBe('#d94f5a');
    expect(painColor(5)).toBe('#e08a2f');
    expect(painColor(2)).toBe('#2f8f63');
  });

  it('etiquetas EVA', () => {
    expect(painLabel(0)).toBe('Sin dolor');
    expect(painLabel(10)).toBe('El peor dolor');
  });
});

describe('core checkin-dose', () => {
  it('exige motivo cuando la dosis no es la indicada', () => {
    const doses: CheckInDose[] = [
      { med: 'X', dose: '1', indicated: '1', taken: 'mayor', amount: '', reason: '', reasonText: '' },
    ];
    expect(validateDoses(doses)).toMatch(/motivo/i);
  });
});

describe('core derived-patient', () => {
  const row = (over: Partial<CheckInRow>): CheckInRow => ({
    patientRut: '11222333-9',
    time: '08:00',
    pain: 5,
    zones: [],
    mood: '',
    sleep: '',
    why: [],
    medsTaken: [],
    medsDetail: [],
    notes: { zones: '', mood: '', sleep: '' },
    doses: [],
    adverseNote: '',
    nausea: false,
    vomiting: false,
    bowelMovements: null,
    giDetail: {},
    erVisit: false,
    erReason: '',
    erDetail: '',
    reportedBy: 'cuidador',
    caregiverName: 'Ana',
    caregiverRelation: 'Hija',
    createdAt: '2026-10-09T12:00:00.000Z',
    ...over,
  });

  it('recuerda el último cuidador', () => {
    const cg = lastCaregiver([row({})], '11222333-9');
    expect(cg).toEqual({ name: 'Ana', relation: 'Hija' });
  });

  it('cuenta racha de días con registro', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const iso = today.toISOString();
    expect(checkInStreak([row({ createdAt: iso })], '11222333-9')).toBeGreaterThanOrEqual(1);
  });
});
