import { describe, expect, it } from 'vitest';
import type { CheckInRecord, Medication } from '@/features/patient/types';
import {
  STEP,
  allMissing,
  attributionSummaryOf,
  buildCheckInRecord,
  initialDraft,
  nextStep,
  prevStep,
  stepFlow,
  stepMissing,
  toggleRelief,
  toggleTrigger,
} from '@/features/patient/utils/checkin';
import type { CheckinDraft } from '@/features/patient/utils/checkin';
import {
  attributionContext,
  reliefOptions,
  showReliefTriggerSteps,
  triggerOptions,
} from '@/features/patient/utils/checkin-steps';
import { CATALOG_VERSION, RELIEF_CATALOG, TRIGGER_CATALOG } from '@/shared/data/trigger-catalog';

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

const NOW = new Date('2026-10-10T15:30:00.000Z');

function draftOf(patch: Partial<CheckinDraft> = {}): CheckinDraft {
  return { ...initialDraft([med], null), emergency: false, registrant: 'self', zones: ['Lumbar'], ...patch };
}

function rec(id: string, date: string, time: string, pain: number): CheckInRecord {
  return { id, date, time, pain, zones: [], emergency: false, registrant: 'self', doses: [] };
}

describe('showReliefTriggerSteps — mismas reglas que la web (DIF-02)', () => {
  it('siempre en el primer check-in del día', () => {
    expect(showReliefTriggerSteps({ pain: 0, previousPain: null, firstOfDay: true })).toBe(true);
    expect(showReliefTriggerSteps({ pain: 1, previousPain: 1, firstOfDay: true })).toBe(true);
  });

  it('dolor ≥ 4 en un check-in posterior', () => {
    expect(showReliefTriggerSteps({ pain: 4, previousPain: 4, firstOfDay: false })).toBe(true);
    expect(showReliefTriggerSteps({ pain: 3, previousPain: 3, firstOfDay: false })).toBe(false);
  });

  it('cambio de 2 o más puntos contra el registro anterior, en ambos sentidos', () => {
    expect(showReliefTriggerSteps({ pain: 3, previousPain: 1, firstOfDay: false })).toBe(true);
    expect(showReliefTriggerSteps({ pain: 1, previousPain: 3, firstOfDay: false })).toBe(true);
    expect(showReliefTriggerSteps({ pain: 2, previousPain: 1, firstOfDay: false })).toBe(false);
  });

  it('sin registro anterior y sin primer check-in no hay cambio que medir', () => {
    expect(showReliefTriggerSteps({ pain: 2, previousPain: null, firstOfDay: false })).toBe(false);
  });
});

describe('attributionContext', () => {
  it('sin registros es el primer check-in y no hay dolor previo', () => {
    expect(attributionContext([], NOW)).toEqual({ previousPain: null, firstOfDay: true });
  });

  it('registros solo de días anteriores: primer check-in de hoy, con el último dolor conocido', () => {
    const ctx = attributionContext(
      [rec('a', '2026-10-08', '10:00', 7), rec('b', '2026-10-09', '21:00', 3)],
      NOW,
    );
    expect(ctx).toEqual({ previousPain: 3, firstOfDay: true });
  });

  it('con un registro de hoy ya no es el primero y el dolor previo es el de hoy', () => {
    const ctx = attributionContext(
      [rec('a', '2026-10-09', '21:00', 8), rec('b', '2026-10-10', '08:00', 2), rec('c', '2026-10-10', '12:00', 5)],
      NOW,
    );
    expect(ctx).toEqual({ previousPain: 5, firstOfDay: false });
  });

  it('ordena por createdAt aunque lleguen desordenados', () => {
    const a = { ...rec('a', '2026-10-10', '12:00', 6), createdAt: '2026-10-10T12:00:00.000Z' };
    const b = { ...rec('b', '2026-10-10', '08:00', 1), createdAt: '2026-10-10T08:00:00.000Z' };
    expect(attributionContext([a, b], NOW).previousPain).toBe(6);
  });
});

describe('flujo de pasos', () => {
  it('con pasos opcionales: 10 pasos y el resumen al final', () => {
    const f = stepFlow(true);
    expect(f).toHaveLength(10);
    expect(f.slice(-3)).toEqual([STEP.alivios, STEP.gatillantes, STEP.resumen]);
  });

  it('sin ellos se saltan alivios y gatillantes', () => {
    const f = stepFlow(false);
    expect(f).toHaveLength(8);
    expect(f).not.toContain(STEP.alivios);
    expect(f).not.toContain(STEP.gatillantes);
    expect(nextStep(STEP.digestivo, false)).toBe(STEP.resumen);
    expect(prevStep(STEP.resumen, false)).toBe(STEP.digestivo);
  });

  it('avanza y retrocede por los opcionales cuando están visibles', () => {
    expect(nextStep(STEP.digestivo, true)).toBe(STEP.alivios);
    expect(nextStep(STEP.alivios, true)).toBe(STEP.gatillantes);
    expect(nextStep(STEP.gatillantes, true)).toBe(STEP.resumen);
    expect(prevStep(STEP.resumen, true)).toBe(STEP.gatillantes);
    expect(prevStep(STEP.urgencias, true)).toBe(STEP.urgencias);
    expect(nextStep(STEP.resumen, true)).toBe(STEP.resumen);
  });

  it('los pasos opcionales nunca bloquean', () => {
    const d = draftOf({ reliefSel: toggleRelief([], 'otro'), triggerSel: ['otro'], triggerOther: '' });
    expect(stepMissing(STEP.alivios, d, [med])).toEqual([]);
    expect(stepMissing(STEP.gatillantes, d, [med])).toEqual([]);
    expect(allMissing(d, [med])).toEqual([]);
  });
});

describe('opciones del catálogo v1.0', () => {
  it('usan solo ids del catálogo y "Otro" al final', () => {
    const rel = reliefOptions();
    const trg = triggerOptions();
    expect(rel.slice(0, -1).every((o) => RELIEF_CATALOG.some((c) => c.id === o.id))).toBe(true);
    expect(trg.slice(0, -1).every((o) => TRIGGER_CATALOG.some((c) => c.id === o.id))).toBe(true);
    expect(rel[rel.length - 1].id).toBe('otro');
    expect(trg[trg.length - 1].id).toBe('otro');
    expect(rel).toHaveLength(RELIEF_CATALOG.length + 1);
    expect(trg).toHaveLength(TRIGGER_CATALOG.length + 1);
  });

  it('los sugeridos van primero', () => {
    const trg = triggerOptions('fibromialgia');
    expect(trg[0].suggested).toBe(true);
    expect(trg.findIndex((o) => !o.suggested)).toBeGreaterThanOrEqual(4);
  });
});

describe('buildCheckInRecord — gatillantes y alivios', () => {
  it('guarda ids y nivel con catalogVersion 1.0', () => {
    let rel = toggleRelief([], 'descanso');
    rel = rel.map((a) => ({ ...a, relief: 'mucho' as const }));
    const d = draftOf({ reliefSel: rel, triggerSel: toggleTrigger(['estres'], 'mala-noche') });
    const r = buildCheckInRecord(d, [med], NOW, 'x', true)!;
    expect(r.triggers).toEqual(['estres', 'mala-noche']);
    expect(r.reliefActions).toEqual([{ action: 'descanso', relief: 'mucho' }]);
    expect(r.catalogVersion).toBe(CATALOG_VERSION);
  });

  it('"Otro" guarda el texto: otro:<texto> en gatillantes, text en alivios', () => {
    const d = draftOf({
      triggerSel: ['otro'],
      triggerOther: '  lluvia ',
      reliefSel: [{ action: 'otro', relief: 'algo', text: ' paseo ' }],
    });
    const r = buildCheckInRecord(d, [med], NOW, 'x', true)!;
    expect(r.triggers).toEqual(['otro:lluvia']);
    expect(r.reliefActions).toEqual([{ action: 'otro', relief: 'algo', text: 'paseo' }]);
  });

  it('"Otro" sin texto se descarta y el registro queda como antes', () => {
    const d = draftOf({ triggerSel: ['otro'], reliefSel: toggleRelief([], 'otro') });
    const r = buildCheckInRecord(d, [med], NOW, 'x', true)!;
    expect('triggers' in r).toBe(false);
    expect('reliefActions' in r).toBe(false);
    expect('catalogVersion' in r).toBe(false);
  });

  it('omitido (listas vacías) no agrega campos', () => {
    const r = buildCheckInRecord(draftOf(), [med], NOW, 'x', true)!;
    expect(Object.keys(r)).not.toContain('triggers');
    expect(Object.keys(r)).not.toContain('reliefActions');
  });

  it('si los pasos no estaban visibles, lo elegido se descarta', () => {
    const d = draftOf({ triggerSel: ['estres'], reliefSel: toggleRelief([], 'descanso') });
    const r = buildCheckInRecord(d, [med], NOW, 'x', false)!;
    expect(Object.keys(r)).not.toContain('triggers');
    expect(Object.keys(r)).not.toContain('reliefActions');
  });

  it('toggleRelief y toggleTrigger marcan y desmarcan', () => {
    const on = toggleRelief([], 'masaje');
    expect(on).toEqual([{ action: 'masaje', relief: 'algo' }]);
    expect(toggleRelief(on, 'masaje')).toEqual([]);
    expect(toggleTrigger(['estres'], 'estres')).toEqual([]);
  });
});

describe('attributionSummaryOf', () => {
  it('describe lo contestado y calla si nada o si no estaba visible', () => {
    const d = draftOf({
      triggerSel: ['estres'],
      reliefSel: [{ action: 'descanso', relief: 'mucho' }],
    });
    expect(attributionSummaryOf(d, true)).toBe('Gatillantes: Estrés. Alivios: Descansé mejor (mucho).');
    expect(attributionSummaryOf(d, false)).toBeNull();
    expect(attributionSummaryOf(draftOf(), true)).toBeNull();
  });
});
