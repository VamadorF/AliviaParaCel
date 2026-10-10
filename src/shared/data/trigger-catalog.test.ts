import { describe, expect, it } from 'vitest';
import type { CheckInRecord } from '@/features/patient/types';
import { DEMO_BOOTSTRAP, CLEAN_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import {
  CATALOG_VERSION,
  TRIGGER_CATALOG,
  attributionsOf,
  classifyWhy,
  migrateWhy,
  otherTrigger,
  suggestionsForPathology,
  triggerLabel,
} from './trigger-catalog';

describe('migrateWhy / classifyWhy', () => {
  it('reparte los why históricos en ids del catálogo web', () => {
    const m = migrateWhy([
      '😰 Estrés',
      '💊 Tomé mi medicación',
      '🥶 Cambio de clima',
      '♨️ Calor / frío local',
      '😴 Descansé mejor',
      '🏋️ Sobreesfuerzo',
      '🌙 Mala noche',
      '🚶 Ejercicio suave',
    ]);
    expect(m.triggers).toEqual(['estres', 'cambio-clima', 'sobreesfuerzo', 'mala-noche']);
    expect(m.reliefActions.map((a) => a.action)).toEqual(['medicacion', 'calor-frio', 'descanso', 'ejercicio-suave']);
    expect(m.catalogVersion).toBe('1.0');
  });

  it('"No lo sé" queda sin clasificar en classifyWhy', () => {
    const r = classifyWhy(['🤷 No lo sé', 'Algo raro']);
    expect(r.triggers).toEqual([]);
    expect(r.reliefs).toEqual([]);
    expect(r.unclassified.length).toBeGreaterThan(0);
  });
});

describe('attributionsOf', () => {
  it('prefiere los campos nuevos (ids)', () => {
    const a = attributionsOf({
      triggers: ['estres'],
      reliefActions: [{ action: 'ejercicio-suave', relief: 'mucho' }],
      why: ['Mala noche'],
    });
    expect(a.triggers).toEqual(['estres']);
    expect(a.reliefActions[0].action).toBe('ejercicio-suave');
  });

  it('migra why en registros viejos', () => {
    const demo = DEMO_BOOTSTRAP.checkIns.find((c) => c.why?.length);
    expect(demo).toBeDefined();
    const a = attributionsOf(demo!);
    expect(a.triggers.length + a.reliefActions.length).toBeGreaterThan(0);
  });
});

describe('catálogo', () => {
  it('otherTrigger usa prefijo otro:', () => {
    expect(otherTrigger(' lluvia ')).toBe('otro:lluvia');
  });

  it('sugerencias por patología devuelven ids kebab-case', () => {
    const s = suggestionsForPathology('Fibromialgia');
    expect(s.triggers.every((id) => TRIGGER_CATALOG.some((t) => t.id === id))).toBe(true);
    expect(s.reliefs.every((id) => /^[a-z0-9-]+$/.test(id))).toBe(true);
  });

  it('triggerLabel resuelve ids', () => {
    expect(triggerLabel('estres')).toBe('Estrés');
  });

  it('fixtures demo: c1 usa ids; usuario limpio sin check-ins inventados', () => {
    const c1 = DEMO_BOOTSTRAP.checkIns[0];
    expect(c1.catalogVersion).toBe(CATALOG_VERSION);
    expect(c1.triggers?.[0]).toBe('mala-noche');
    expect(CLEAN_BOOTSTRAP.checkIns).toHaveLength(0);
  });
});
