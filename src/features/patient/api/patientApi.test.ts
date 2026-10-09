import { describe, expect, it } from 'vitest';
import { CLEAN_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';

const cleanUser = MOCK_USERS.find((u) => u.rut === CLEAN_RUT)!;

describe('patientApi (mock repository)', () => {
  it('appendCheckIn agrega al inicio y persiste', async () => {
    const patient = createMockPatientRepository({
      storage: createMemoryStorage(),
      delayMs: 0,
    });
    const base = await patient.loadBootstrap(cleanUser.id, 'clean');
    const next = await patient.appendCheckIn(cleanUser.id, 'clean', {
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

    const again = await patient.loadBootstrap(cleanUser.id, 'clean');
    expect(again.checkIns[0].id).toBe('x');
  });
});
