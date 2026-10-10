import { describe, expect, it } from 'vitest';
import type { CheckInRow } from '@/shared/core/checkin-row';
import type { CheckInRecord, Medication } from '@/features/patient/types';
import {
  CHECKIN_STEPS,
  STEP,
  allMissing,
  buildCheckInRecord,
  giSummary,
  initialDraft,
  lastCaregiverOf,
  parseBowel,
  patchDose,
  sanitizeBowel,
  stepMissing,
  toCheckInRow,
} from '@/features/patient/utils/checkin';
import type { CheckinDraft } from '@/features/patient/utils/checkin';

const med: Medication = {
  id: 'm1',
  name: 'Paracetamol',
  concentration: '500 mg',
  form: 'Comprimido',
  quantity: '1 comprimido',
  route: 'Oral',
  frequency: 'Cada 8 horas',
  duration: 'Uso continuo',
  status: 'activo',
};

const RUT = '9.876.543-3';

function draftOf(patch: Partial<CheckinDraft> = {}, meds: Medication[] = [med]): CheckinDraft {
  return {
    ...initialDraft(meds, null),
    emergency: false,
    registrant: 'self',
    zones: ['Lumbar'],
    ...patch,
  };
}

describe('stepMissing — mensajes "Falta: …" iguales a los de la web', () => {
  it('urgencias sin responder', () => {
    expect(stepMissing(STEP.urgencias, draftOf({ emergency: null }), [med])).toEqual(['urgencias']);
  });

  it('urgencias exige motivo y "qué pasó"', () => {
    const base = draftOf({ emergency: true });
    expect(stepMissing(STEP.urgencias, base, [med])).toEqual(['datos de urgencias']);
    expect(stepMissing(STEP.urgencias, { ...base, emergencyReason: 'Dolor' }, [med])).toEqual(['datos de urgencias']);
    expect(stepMissing(STEP.urgencias, { ...base, emergencyDetail: 'Me atendieron' }, [med])).toEqual(['datos de urgencias']);
    expect(
      stepMissing(STEP.urgencias, { ...base, emergencyReason: 'Dolor', emergencyDetail: 'Me atendieron' }, [med]),
    ).toEqual([]);
  });

  it('espacios en blanco no cuentan como texto', () => {
    const d = draftOf({ emergency: true, emergencyReason: '  ', emergencyDetail: ' ' });
    expect(stepMissing(STEP.urgencias, d, [med])).toEqual(['datos de urgencias']);
  });

  it('quién registra, y nombre y relación si es cuidador', () => {
    expect(stepMissing(STEP.quien, draftOf({ registrant: null }), [med])).toEqual(['quién registra']);
    expect(stepMissing(STEP.quien, draftOf({ registrant: 'caregiver' }), [med])).toEqual([
      'nombre del cuidador',
      'relación del cuidador',
    ]);
    expect(
      stepMissing(STEP.quien, draftOf({ registrant: 'caregiver', caregiverName: 'Ana', caregiverRelation: ' ' }), [med]),
    ).toEqual(['relación del cuidador']);
    expect(
      stepMissing(STEP.quien, draftOf({ registrant: 'caregiver', caregiverName: 'Ana', caregiverRelation: 'Hija' }), [med]),
    ).toEqual([]);
  });

  it('paciente que registra no necesita datos de cuidador aunque estén precargados', () => {
    const d = draftOf({ registrant: 'self', caregiverName: '', caregiverRelation: '' });
    expect(stepMissing(STEP.quien, d, [med])).toEqual([]);
  });

  it('dosis distinta de lo indicado exige motivo; "Otro" exige texto', () => {
    const d = draftOf();
    const menor = { ...d, doses: { m1: patchDose(d.doses.m1, { taken: 'menor' }) } };
    expect(stepMissing(STEP.medicamentos, menor, [med])).toEqual(['el motivo de Paracetamol']);
    const otro = { ...menor, doses: { m1: patchDose(menor.doses.m1, { reason: 'otro' }) } };
    expect(stepMissing(STEP.medicamentos, otro, [med])).toEqual(['el motivo de Paracetamol']);
    const conTexto = { ...otro, doses: { m1: patchDose(otro.doses.m1, { reasonText: 'Me dio sueño' }) } };
    expect(stepMissing(STEP.medicamentos, conTexto, [med])).toEqual([]);
    const olvido = { ...menor, doses: { m1: patchDose(menor.doses.m1, { reason: 'olvido' }) } };
    expect(stepMissing(STEP.medicamentos, olvido, [med])).toEqual([]);
  });

  it('sin medicamentos activos el paso de dosis no bloquea', () => {
    expect(stepMissing(STEP.medicamentos, draftOf({}, []), [])).toEqual([]);
  });

  it('el paso digestivo y el texto libre nunca bloquean', () => {
    const d = draftOf({ bowel: '', adverseNote: '' });
    expect(stepMissing(STEP.digestivo, d, [med])).toEqual([]);
    expect(stepMissing(STEP.resumen, d, [med])).toEqual([]);
  });

  it('allMissing junta todos los pasos en orden', () => {
    const d = draftOf({ emergency: null, registrant: null, zones: [] });
    expect(allMissing(d, [med])).toEqual(['urgencias', 'quién registra', 'al menos una zona']);
  });

  it('el check-in tiene 8 pasos y el resumen es el último', () => {
    expect(CHECKIN_STEPS).toBe(8);
    expect(STEP.resumen).toBe(CHECKIN_STEPS - 1);
  });
});

describe('patchDose', () => {
  const base = patchDose(initialDraft([med], null).doses.m1, { taken: 'mayor' });

  it('mayor ofrece uso SOS, tolerancia u otro', () => {
    expect(patchDose(base, { reason: 'sos' }).reason).toBe('sos');
  });

  it('cambiar a un tipo que no admite el motivo lo borra', () => {
    const conSos = patchDose(base, { reason: 'sos' });
    expect(patchDose(conSos, { taken: 'menor' }).reason).toBe('');
    expect(patchDose(patchDose(base, { reason: 'tolerancia' }), { taken: 'ninguna' }).reason).toBe('tolerancia');
  });

  it('volver a "lo indicado" limpia motivo, texto y cantidad', () => {
    const lleno = patchDose(patchDose(base, { reason: 'otro' }), { reasonText: 'x', amount: '2' });
    const igual = patchDose(lleno, { taken: 'igual' });
    expect(igual).toMatchObject({ taken: 'igual', reason: '', reasonText: '', amount: '' });
  });

  it('cambiar de "otro" a otro motivo descarta el texto', () => {
    const otro = patchDose(patchDose(base, { reason: 'otro' }), { reasonText: 'x' });
    expect(patchDose(otro, { reason: 'sos' }).reasonText).toBe('');
  });
});

describe('deposiciones', () => {
  it('solo dígitos y máximo dos', () => {
    expect(sanitizeBowel('a1b2c3')).toBe('12');
    expect(sanitizeBowel('-5')).toBe('5');
    expect(sanitizeBowel('100')).toBe('10');
    expect(sanitizeBowel('')).toBe('');
  });

  it('vacío es "no reporta"; 0 es un valor', () => {
    expect(parseBowel('')).toBeNull();
    expect(parseBowel(' ')).toBeNull();
    expect(parseBowel('0')).toBe(0);
    expect(parseBowel('07')).toBe(7);
    expect(parseBowel('99')).toBe(99);
  });
});

describe('giSummary', () => {
  it('sin nada destacable devuelve null', () => {
    expect(giSummary(draftOf())).toBeNull();
  });

  it('lista lo reportado', () => {
    const d = draftOf({ nausea: true, vomiting: true, bowel: '0', appetite: 'reducido', reflux: true });
    expect(giSummary(d)).toBe('náuseas, vómitos, sin deposiciones, apetito reducido, reflujo o acidez');
  });
});

describe('buildCheckInRecord', () => {
  const now = new Date('2026-10-10T15:30:00.000Z');

  it('no arma el registro sin urgencias o sin quién registra', () => {
    expect(buildCheckInRecord(draftOf({ emergency: null }), [med], now, 'x')).toBeNull();
    expect(buildCheckInRecord(draftOf({ registrant: null }), [med], now, 'x')).toBeNull();
  });

  it('paciente: no guarda datos de cuidador ni de urgencias aunque estén en el borrador', () => {
    const d = draftOf({
      registrant: 'self',
      caregiverName: 'Ana',
      caregiverRelation: 'Hija',
      emergencyReason: 'Dolor',
      emergencyDetail: 'Algo',
    });
    const r = buildCheckInRecord(d, [med], now, 'local-1')!;
    expect(r).toMatchObject({
      id: 'local-1',
      emergency: false,
      emergencyReason: '',
      emergencyDetail: '',
      registrant: 'self',
      caregiverName: '',
      caregiverRelation: '',
      createdAt: '2026-10-10T15:30:00.000Z',
    });
  });

  it('cuidador y urgencias se guardan sin espacios sobrantes', () => {
    const d = draftOf({
      emergency: true,
      emergencyReason: ' Dolor fuerte ',
      emergencyDetail: ' Me atendieron en el SAPU ',
      registrant: 'caregiver',
      caregiverName: ' Ana Pérez ',
      caregiverRelation: ' Hija ',
    });
    const r = buildCheckInRecord(d, [med], now, 'local-2')!;
    expect(r).toMatchObject({
      emergency: true,
      emergencyReason: 'Dolor fuerte',
      emergencyDetail: 'Me atendieron en el SAPU',
      registrant: 'caregiver',
      caregiverName: 'Ana Pérez',
      caregiverRelation: 'Hija',
    });
  });

  it('dosis: conserva el formato antiguo y agrega el detalle con motivo y cantidad', () => {
    const d = draftOf();
    d.doses.m1 = patchDose(patchDose(d.doses.m1, { taken: 'menor' }), { reason: 'olvido', amount: ' media ' });
    const r = buildCheckInRecord(d, [med], now, 'local-3')!;
    expect(r.doses).toEqual([{ medId: 'm1', choice: 'less' }]);
    expect(r.doseDetails).toEqual([
      {
        med: 'Paracetamol',
        dose: '500 mg',
        indicated: '1 comprimido · Oral · Cada 8 horas',
        taken: 'menor',
        amount: 'media',
        reason: 'olvido',
        reasonText: '',
      },
    ]);
  });

  it('texto libre y efecto adverso se recortan; GI sale completo', () => {
    const d = draftOf({
      adverseNote: '  mareo  ',
      notes: { zones: ' punzante ', mood: '', sleep: ' ' },
      nausea: true,
      bowel: '2',
      appetite: 'nulo',
    });
    const r = buildCheckInRecord(d, [med], now, 'local-4')!;
    expect(r.adverseNote).toBe('mareo');
    expect(r.notes).toEqual({ zones: 'punzante', mood: '', sleep: '' });
    expect(r.giDetail).toEqual({ nausea: true, vomiting: false, bowelMovements: 2, appetite: 'nulo', reflux: false });
  });

  it('sin medicamentos activos no inventa dosis', () => {
    const r = buildCheckInRecord(draftOf({}, []), [], now, 'local-5')!;
    expect(r.doses).toEqual([]);
    expect(r.doseDetails).toEqual([]);
  });
});

describe('toCheckInRow — misma forma que el CheckInRow de la web', () => {
  const WEB_KEYS: (keyof CheckInRow)[] = [
    'patientRut', 'time', 'pain', 'zones', 'mood', 'sleep', 'why', 'medsTaken', 'medsDetail', 'notes',
    'doses', 'adverseNote', 'nausea', 'vomiting', 'bowelMovements', 'giDetail',
    'erVisit', 'erReason', 'erDetail', 'reportedBy', 'caregiverName', 'caregiverRelation', 'createdAt',
  ];

  it('tiene exactamente las claves de la web', () => {
    const d = draftOf();
    const r = buildCheckInRecord(d, [med], new Date('2026-10-10T15:30:00.000Z'), 'x')!;
    expect(Object.keys(toCheckInRow(r, RUT)).sort()).toEqual([...WEB_KEYS].sort());
  });

  it('traduce urgencias, cuidador, GI y dosis', () => {
    const d = draftOf({
      emergency: true,
      emergencyReason: 'Dolor',
      emergencyDetail: 'Me atendieron',
      registrant: 'caregiver',
      caregiverName: 'Ana',
      caregiverRelation: 'Hija',
      nausea: true,
      bowel: '3',
    });
    d.doses.m1 = patchDose(d.doses.m1, { taken: 'ninguna' });
    d.doses.m1 = patchDose(d.doses.m1, { reason: 'falta' });
    const row = toCheckInRow(buildCheckInRecord(d, [med], new Date('2026-10-10T15:30:00.000Z'), 'x')!, RUT);
    expect(row).toMatchObject({
      patientRut: RUT,
      erVisit: true,
      erReason: 'Dolor',
      erDetail: 'Me atendieron',
      reportedBy: 'cuidador',
      caregiverName: 'Ana',
      caregiverRelation: 'Hija',
      nausea: true,
      vomiting: false,
      bowelMovements: 3,
      medsTaken: [],
      medsDetail: [{ name: 'Paracetamol', percentTaken: 0, adverseNotes: 'Falta de medicamento' }],
      createdAt: '2026-10-10T15:30:00.000Z',
    });
  });

  it('un registro antiguo (sin campos nuevos) sigue convirtiéndose', () => {
    const old: CheckInRecord = {
      id: 'c2',
      date: '2026-10-09',
      time: '21:00',
      pain: 5,
      zones: ['Lumbar'],
      emergency: false,
      registrant: 'self',
      doses: [{ medId: 'm1', choice: 'indicated' }],
      why: ['Estrés'],
    };
    const row = toCheckInRow(old, RUT);
    expect(row).toMatchObject({
      mood: '',
      sleep: '',
      why: ['Estrés'],
      doses: [],
      adverseNote: '',
      bowelMovements: null,
      erVisit: false,
      reportedBy: 'paciente',
      caregiverName: '',
    });
    expect(Number.isNaN(Date.parse(row.createdAt))).toBe(false);
  });
});

describe('lastCaregiverOf — precarga del cuidador', () => {
  const rec = (id: string, createdAt: string, patch: Partial<CheckInRecord>): CheckInRecord => ({
    id,
    date: createdAt.slice(0, 10),
    time: '10:00',
    createdAt,
    pain: 3,
    zones: [],
    emergency: false,
    registrant: 'self',
    doses: [],
    ...patch,
  });

  it('sin registros o sin cuidador devuelve null', () => {
    expect(lastCaregiverOf([], RUT)).toBeNull();
    expect(lastCaregiverOf([rec('a', '2026-10-08T10:00:00.000Z', {})], RUT)).toBeNull();
  });

  it('toma el cuidador del registro más reciente, venga el arreglo en el orden que venga', () => {
    const viejo = rec('a', '2026-10-07T10:00:00.000Z', {
      registrant: 'caregiver',
      caregiverName: 'Luis',
      caregiverRelation: 'Hermano',
    });
    const nuevo = rec('b', '2026-10-09T10:00:00.000Z', {
      registrant: 'caregiver',
      caregiverName: ' Ana ',
      caregiverRelation: 'Hija',
    });
    const yo = rec('c', '2026-10-10T10:00:00.000Z', {});
    expect(lastCaregiverOf([yo, nuevo, viejo], RUT)).toEqual({ name: 'Ana', relation: 'Hija' });
    expect(lastCaregiverOf([viejo, nuevo, yo], RUT)).toEqual({ name: 'Ana', relation: 'Hija' });
  });

  it('ignora un registro de cuidador sin nombre (dato antiguo)', () => {
    const sinNombre = rec('a', '2026-10-09T10:00:00.000Z', { registrant: 'caregiver' });
    expect(lastCaregiverOf([sinNombre], RUT)).toBeNull();
  });
});
