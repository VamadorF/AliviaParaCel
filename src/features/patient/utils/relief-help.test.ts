import { describe, expect, it } from 'vitest';
import { RELIEF_CATALOG } from '@/shared/data/trigger-catalog';
import { RELIEF_HELP_MIN, reliefHelpDetail, reliefHelpOf } from '@/features/patient/utils/relief-help';

describe('reliefHelpOf — conteo', () => {
  it('cuenta las veces que el paciente reportó cada alivio y deja fuera los gatillantes', () => {
    const rows = reliefHelpOf([
      {
        reliefActions: [
          { action: 'calor-frio', relief: 'mucho' },
          { action: 'masaje', relief: 'algo' },
        ],
      },
      { reliefActions: [{ action: 'calor-frio', relief: 'mucho' }] },
      { reliefActions: [{ action: 'calor-frio', relief: 'algo' }] },
      { triggers: ['estres'], why: ['😰 Estrés'] },
    ]);

    const mucho = rows.find((r) => r.action === 'calor-frio' && r.relief === 'mucho')!;
    const algo = rows.find((r) => r.action === 'calor-frio' && r.relief === 'algo')!;
    const masaje = rows.find((r) => r.action === 'masaje')!;

    expect(mucho.count).toBe(2);
    expect(algo.count).toBe(1);
    expect(masaje.count).toBe(1);
    expect(mucho.label).toBe('Calor o frío local');
    expect(mucho.copy).toBe('Dijiste que el calor o el frío local te alivió mucho');
    expect(algo.copy).toBe('Dijiste que el calor o el frío local te alivió');
    expect(rows.some((r) => r.action === 'estres')).toBe(false);
    expect(mucho.percent).toBe(67);
    expect(algo.percent).toBe(33);
    expect(masaje.percent).toBeUndefined();
    expect(reliefHelpDetail(masaje)).toBe('1 vez');
    expect(reliefHelpDetail(mucho)).toBe('2 veces · 67% de las veces que lo registraste');
  });

  it('suma un why antiguo migrado al catálogo', () => {
    const rows = reliefHelpOf([
      { why: ['Calor o frío local'] },
      { reliefActions: [{ action: 'calor-frio', relief: 'mucho' }] },
      { reliefActions: [{ action: 'calor-frio', relief: 'mucho' }] },
    ]);
    expect(rows.find((r) => r.relief === 'mucho')!.count).toBe(2);
    expect(rows.find((r) => r.relief === 'algo')!.count).toBe(1);
  });

  it('usa el texto de Otro y no lo mezcla con otra frase', () => {
    const rows = reliefHelpOf([
      { reliefActions: [{ action: 'otro', relief: 'algo', text: 'paseo' }] },
      { reliefActions: [{ action: 'otro', relief: 'algo', text: 'té' }] },
    ]);
    expect(rows.map((r) => r.copy).sort()).toEqual([
      'Dijiste que «paseo» te alivió',
      'Dijiste que «té» te alivió',
    ]);
  });

  it('cada id del catálogo tiene frase propia y la etiqueta del catálogo', () => {
    for (const item of RELIEF_CATALOG) {
      const [row] = reliefHelpOf([{ reliefActions: [{ action: item.id, relief: 'algo' }] }]);
      const cruda = `Dijiste que ${item.label.charAt(0).toLowerCase()}${item.label.slice(1)} te alivió`;
      expect(row.label).toBe(item.label);
      expect(row.copy).not.toBe(cruda);
      expect(row.copy).toMatch(/^Dijiste que .+ te alivió$/);
      expect(row.copy).not.toMatch(/recomend|deberías|prueba|conviene|causa|porque/i);
    }
  });
});

describe('reliefHelpOf — porcentaje', () => {
  it('con menos de 3 registros de una acción no hay porcentaje', () => {
    const rows = reliefHelpOf([
      { reliefActions: [{ action: 'descanso', relief: 'mucho' }] },
      { reliefActions: [{ action: 'descanso', relief: 'algo' }] },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.reduce((sum, row) => sum + row.count, 0)).toBeLessThan(RELIEF_HELP_MIN);
    for (const row of rows) {
      expect(row.percent).toBeUndefined();
      expect(reliefHelpDetail(row)).not.toContain('%');
      expect(row.copy.startsWith('Dijiste que ')).toBe(true);
    }
  });

  it('si las tres veces dijo que no, el porcentaje es 100 y la frase no propone otra cosa', () => {
    const [row] = reliefHelpOf([
      { reliefActions: [{ action: 'masaje', relief: 'nada' }] },
      { reliefActions: [{ action: 'masaje', relief: 'nada' }] },
      { reliefActions: [{ action: 'masaje', relief: 'nada' }] },
    ]);
    expect(row.count).toBe(3);
    expect(row.percent).toBe(100);
    expect(row.copy).toBe('Dijiste que el masaje no te alivió');
    expect(reliefHelpDetail(row)).toContain('%');
  });
});
