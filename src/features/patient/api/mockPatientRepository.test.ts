import { describe, expect, it } from 'vitest';
import { CLEAN_RUT, DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';

const demoUser = MOCK_USERS.find((u) => u.rut === DEMO_RUT)!;
const cleanUser = MOCK_USERS.find((u) => u.rut === CLEAN_RUT)!;

function repo() {
  return createMockPatientRepository({
    storage: createMemoryStorage(),
    delayMs: 0,
  });
}

describe('mockPatientRepository', () => {
  it('usuario limpio sin check-ins al sembrar', async () => {
    const data = await repo().loadBootstrap(cleanUser.id, 'clean');
    expect(data.checkIns).toHaveLength(0);
    expect(data.medications).toHaveLength(0);
  });

  it('demo trae check-ins de fixture', async () => {
    const data = await repo().loadBootstrap(demoUser.id, 'demo');
    expect(data.checkIns.length).toBeGreaterThan(0);
  });

  it('persiste check-in entre cargas', async () => {
    const patient = repo();
    await patient.loadBootstrap(demoUser.id, 'demo');
    const next = await patient.appendCheckIn(demoUser.id, 'demo', {
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

    const reloaded = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(reloaded.checkIns[0].id).toBe('x');
  });

  it('saveBootstrap persiste entre cargas', async () => {
    const patient = repo();
    const base = await patient.loadBootstrap(demoUser.id, 'demo');
    const edited = { ...base, messages: [{ id: 'm-new', from: 'team' as const, body: 'Hola', at: '2026-01-01T10:00:00Z' }] };
    await patient.saveBootstrap(demoUser.id, edited);
    const reloaded = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(reloaded.messages).toHaveLength(1);
    expect(reloaded.messages[0].id).toBe('m-new');
  });

  it('JSON inválido en storage re-siembra desde fixture', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(`@alivia/patient-bootstrap/v1/${demoUser.id}`, '{no-json');
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const data = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(data.checkIns.some((c) => c.id === 'c1')).toBe(true);
  });

  it('reset demo vuelve al fixture', async () => {
    const patient = repo();
    await patient.appendCheckIn(demoUser.id, 'demo', {
      id: 'temp',
      date: '2026-01-01',
      time: '09:00',
      pain: 2,
      zones: ['Cuello'],
      emergency: false,
      registrant: 'self',
      doses: [],
    });
    const reset = await patient.resetDemoData(demoUser.id, 'demo');
    expect(reset.checkIns.some((c) => c.id === 'temp')).toBe(false);
    expect(reset.checkIns.some((c) => c.id === 'c1')).toBe(true);
  });
});
