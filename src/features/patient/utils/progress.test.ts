import { describe, expect, it } from 'vitest';
import { patientProgress, recentCheckIns } from '@/features/patient/utils/progress';
import type { CheckInRecord } from '@/features/patient/types';

function row(id: string, date: string, pain: number): CheckInRecord {
  return {
    id,
    date,
    time: '10:00',
    pain,
    zones: ['Lumbar'],
    emergency: false,
    registrant: 'self',
    doses: [],
  };
}

describe('MOB-12 · progreso con paridad', () => {
  it('con menos de 2 días de registros muestra el mensaje de curva', () => {
    const p = patientProgress([row('a', '2026-10-11', 4)], '2026-10-11');
    expect(p.chartMessage).toMatch(/Aún no hay suficientes registros/);
    expect(p.chartMessage).toMatch(/1\/2 días/);
  });

  it('registros recientes: máximo 12, del más nuevo al más antiguo', () => {
    const checkIns = Array.from({ length: 14 }, (_, i) =>
      row(`c${i}`, `2026-10-${String(i + 1).padStart(2, '0')}`, i),
    );
    const recent = recentCheckIns(checkIns);
    expect(recent).toHaveLength(12);
    expect(recent[0].id).toBe('c13');
    expect(recent[11].id).toBe('c2');
  });
});
