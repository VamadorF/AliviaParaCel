import { describe, expect, it } from 'vitest';
import type { CheckInRecord } from '@/features/patient/types';
import { DEMO_BOOTSTRAP, CLEAN_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import {
  CATALOG_VERSION,
  RELIEF_CATALOG,
  TRIGGER_CATALOG,
  attributionsOf,
  classifyWhy,
  otherTrigger,
  suggestionsForPathology,
} from './trigger-catalog';

describe('classifyWhy', () => {
  it('reparte los why históricos entre gatillantes y alivios', () => {
    const r = classifyWhy([
      '😰 Estrés',
      '💊 Tomé mi medicación',
      '🥶 Cambio de clima',
      '♨️ Calor / frío local',
      '😴 Descansé mejor',
      '🏋️ Sobreesfuerzo',
      '🌙 Mala noche',
      '🚶 Ejercicio suave',
    ]);
    expect(r.triggers).toEqual(['Estrés', 'Cambio de clima', 'Sobreesfuerzo', 'Mala noche']);
    expect(r.reliefs).toEqual(['Tomé mi medicación', 'Calor o frío local', 'Descansé', 'Ejercicio suave']);
    expect(r.unclassified).toEqual([]);
  });

  it('"No lo sé" y textos desconocidos quedan sin clasificar', () => {
    const r = classifyWhy(['🤷 No lo sé', 'Algo raro']);
    expect(r).toEqual({ triggers: [], reliefs: [], unclassified: ['No lo sé', 'Algo raro'] });
  });

  it('no duplica, ignora vacíos y acepta undefined', () => {
    expect(classifyWhy(['Estrés', '😰 Estrés', '  ']).triggers).toEqual(['Estrés']);
    expect(classifyWhy(undefined)).toEqual({ triggers: [], reliefs: [], unclassified: [] });
  });

  it('toda etiqueta canónica del catálogo que viene del histórico se reconoce a sí misma', () => {
    expect(classifyWhy(['Estrés', 'Mala noche', 'Sobreesfuerzo', 'Cambio de clima']).triggers).toHaveLength(4);
    for (const t of classifyWhy(['Estrés', 'Mala noche', 'Sobreesfuerzo', 'Cambio de clima']).triggers) {
      expect(TRIGGER_CATALOG).toContain(t);
    }
    for (const r of classifyWhy(['Tomé mi medicación', 'Descansé mejor', 'Ejercicio suave', 'Calor o frío local']).reliefs) {
      expect(RELIEF_CATALOG).toContain(r);
    }
  });
});

describe('attributionsOf', () => {
  it('prefiere los campos nuevos', () => {
    const a = attributionsOf({
      triggers: ['Estrés'],
      reliefActions: [{ action: 'Ejercicio suave', relief: 'mucho' }],
      why: ['Mala noche'],
    });
    expect(a).toEqual({
      triggers: ['Estrés'],
      reliefActions: [{ action: 'Ejercicio suave', relief: 'mucho' }],
      legacyReliefs: [],
    });
  });

  it('un registro con solo why se sigue leyendo', () => {
    const a = attributionsOf({ why: ['😰 Estrés', 'Calor o frío local'] });
    expect(a.triggers).toEqual(['Estrés']);
    expect(a.reliefActions).toEqual([]);
    expect(a.legacyReliefs).toEqual(['Calor o frío local']);
  });

  it('un registro sin nada devuelve vacío', () => {
    expect(attributionsOf({})).toEqual({ triggers: [], reliefActions: [], legacyReliefs: [] });
  });
});

describe('otherTrigger / suggestionsForPathology', () => {
  it('"Otro" lleva el texto del paciente', () => {
    expect(otherTrigger('  ruido  ')).toBe('Otro: ruido');
    expect(otherTrigger('  ')).toBe('Otro');
  });

  it('sugiere por patología y cae a un conjunto base', () => {
    expect(suggestionsForPathology('Lumbalgia crónica').triggers).toContain('Postura prolongada');
    expect(suggestionsForPathology('Fibromialgia').reliefs).toContain('Respiración o relajación');
    expect(suggestionsForPathology('Desconocida').triggers).toEqual(['Estrés', 'Mala noche', 'Sobreesfuerzo']);
  });

  it('las sugerencias salen siempre del catálogo', () => {
    for (const p of ['cáncer', 'fibromialgia', 'migraña', 'lumbalgia', 'artritis', 'otra']) {
      const s = suggestionsForPathology(p);
      s.triggers.forEach((t) => expect(TRIGGER_CATALOG).toContain(t));
      s.reliefs.forEach((r) => expect(RELIEF_CATALOG).toContain(r));
    }
  });
});

describe('fixtures', () => {
  const [c1, c2] = DEMO_BOOTSTRAP.checkIns as [CheckInRecord, CheckInRecord];

  it('el demo mezcla un registro nuevo y uno antiguo con solo why', () => {
    expect(c1.catalogVersion).toBe(CATALOG_VERSION);
    expect(c1.triggers).toEqual(['Mala noche']);
    expect(c1.reliefActions?.every((r) => ['nada', 'algo', 'mucho'].includes(r.relief))).toBe(true);
    expect(c2.triggers).toBeUndefined();
    expect(c2.reliefActions).toBeUndefined();
    expect(attributionsOf(c2).triggers).toEqual(['Estrés']);
  });

  it('las etiquetas de los fixtures existen en el catálogo', () => {
    for (const t of c1.triggers ?? []) expect(TRIGGER_CATALOG).toContain(t);
    for (const r of c1.reliefActions ?? []) expect(RELIEF_CATALOG).toContain(r.action);
  });

  it('el usuario nuevo sigue limpio', () => {
    expect(CLEAN_BOOTSTRAP.checkIns).toEqual([]);
  });
});
