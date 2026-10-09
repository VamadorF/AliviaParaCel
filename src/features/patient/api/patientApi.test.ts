import { describe, expect, it } from 'vitest';
import { appendCheckIn, loadBootstrap } from './patientApi';

describe('patientApi', () => {
  it('usuario limpio sin check-ins', () => {
    const data = loadBootstrap('clean');
    expect(data.checkIns).toHaveLength(0);
    expect(data.medications).toHaveLength(0);
  });

  it('guardar check-in agrega al inicio', () => {
    const base = loadBootstrap('demo');
    const next = appendCheckIn(base, {
      id: 'x',
      date: '2026-01-01',
      time: '10:00',
      pain: 3,
      zones: ['Lumbar'],
      emergency: false,
      registrant: 'self',
      doses: [],
    });
    expect(next.checkIns[0].id).toBe('x');
    expect(next.checkIns.length).toBe(base.checkIns.length + 1);
  });
});
