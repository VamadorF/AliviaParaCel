import { describe, expect, it } from 'vitest';
import { instructionTimeline } from '@/features/patient/utils/instruction-history';

describe('PAC-09 · historial de instrucciones', () => {
  it('destaca la vigente y ordena anteriores por fecha', () => {
    const current = { id: 2, text: 'Nueva', date: '2026-10-10T00:00:00.000Z' };
    const history = [
      { id: 1, text: 'Antigua', date: '2026-09-01T00:00:00.000Z' },
      { id: 3, text: 'Intermedia', date: '2026-09-15T00:00:00.000Z' },
    ];
    const { previous } = instructionTimeline(current, history);
    expect(previous.map((r) => r.id)).toEqual([3, 1]);
  });
});
