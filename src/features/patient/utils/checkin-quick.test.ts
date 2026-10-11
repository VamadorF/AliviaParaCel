import { describe, expect, it } from 'vitest';
import type { CheckInRecord } from '@/features/patient/types';
import { buildQuickCheckIn, latestCheckIn, quickDraft, sameAsLast } from '@/features/patient/utils/checkin-quick';

const med = { id: 'm1' };
const NOW = new Date('2026-10-10T15:30:00.000Z');

function record(id: string, createdAt: string, patch: Partial<CheckInRecord> = {}): CheckInRecord {
  return {
    id,
    date: createdAt.slice(0, 10),
    time: '10:00',
    createdAt,
    pain: 4,
    zones: ['Lumbar'],
    mood: 'Regular',
    sleep: '6 h',
    emergency: false,
    registrant: 'self',
    doses: [{ medId: 'm1', choice: 'indicated' }],
    ...patch,
  };
}

describe('check-in rápido (MOB-17)', () => {
  it('las dosis no vienen tomadas', () => {
    const draft = quickDraft([med, { id: 'm2' }]);
    expect(draft.doses).toEqual([
      { medId: 'm1', taken: null },
      { medId: 'm2', taken: null },
    ]);
    expect(draft.doses.every((d) => d.taken === null)).toBe(true);

    const saved = buildQuickCheckIn({ ...draft, pain: 6 }, NOW, 'q1');
    expect(saved).toMatchObject({
      quick: true,
      pain: 6,
      doses: [],
      doseDetails: [],
      registrant: 'self',
      emergency: false,
    });
    expect(saved?.doses.some((d) => d.choice === 'indicated')).toBe(false);
  });

  it('igual que el último copia zonas, ánimo y sueño', () => {
    const last = record('prev', '2026-10-09T08:30:00.000Z', {
      pain: 8,
      zones: ['Lumbar', 'Rodilla'],
      mood: 'Regular',
      sleep: '< 5 h',
      doses: [{ medId: 'm1', choice: 'indicated' }],
    });
    const next = sameAsLast(quickDraft([med]), last);

    expect(next.zones).toEqual(['Lumbar', 'Rodilla']);
    expect(next.mood).toBe('Regular');
    expect(next.sleep).toBe('< 5 h');
    expect(next.usingLast).toBe(true);
    expect(next.pain).toBe(8);
    expect(next.doses).toEqual([{ medId: 'm1', taken: null }]);
    expect(next.zones).not.toBe(last.zones);
  });

  it('si ya eligió una cara, igual que el último no la cambia', () => {
    const draft = { ...quickDraft([med]), pain: 2 };
    const next = sameAsLast(draft, { pain: 9, zones: ['Cuello'], mood: 'Bien', sleep: '7+ h' });
    expect(next.pain).toBe(2);
    expect(next.zones).toEqual(['Cuello']);
    expect(next.mood).toBe('Bien');
    expect(next.sleep).toBe('7+ h');
  });

  it('sin registro anterior no copia nada', () => {
    const draft = quickDraft([med]);
    expect(sameAsLast(draft, null)).toBe(draft);
    expect(latestCheckIn([])).toBeNull();
  });

  it('el último registro es el más reciente', () => {
    const older = record('a', '2026-10-01T10:00:00.000Z', { zones: ['Cabeza'] });
    const newer = record('b', '2026-10-09T10:00:00.000Z', { zones: ['Rodilla'], mood: 'Bien', sleep: '7+ h' });
    expect(latestCheckIn([older, newer])?.id).toBe('b');
    expect(latestCheckIn([newer, older])?.id).toBe('b');
  });

  it('sin dolor o con urgencias incompletas no guarda', () => {
    expect(buildQuickCheckIn(quickDraft([med]), NOW, 'q')).toBeNull();
    const emergency = { ...quickDraft([med]), pain: 8, emergency: true };
    expect(buildQuickCheckIn(emergency, NOW, 'q')).toBeNull();
    const ready = buildQuickCheckIn(
      { ...emergency, emergencyReason: ' Dolor ', emergencyDetail: ' Fui al SAPU ' },
      NOW,
      'q2',
    );
    expect(ready).toMatchObject({
      emergency: true,
      emergencyReason: 'Dolor',
      emergencyDetail: 'Fui al SAPU',
      quick: true,
      doses: [],
    });
  });
});
