import { describe, expect, it } from 'vitest';
import { persistTeamMessage } from '@/features/patient/messaging/teamMessage';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import { DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';

const demoUser = MOCK_USERS.find((user) => user.rut === DEMO_RUT)!;

describe('MOB-10 · mensaje al equipo', () => {
  it('persiste el mensaje en el repositorio y lo recupera al recargar', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const before = await patient.loadBootstrap(demoUser.id, 'demo');

    const saved = await persistTeamMessage(patient, demoUser.id, 'demo', {
      id: 'eq-1',
      body: 'Me duele menos hoy',
      at: '2026-10-10T15:00:00.000Z',
    });
    expect(saved.ok).toBe(true);

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.messages.find((message) => message.id === 'eq-1')).toMatchObject({
      from: 'patient',
      body: 'Me duele menos hoy',
      at: '2026-10-10T15:00:00.000Z',
      channel: 'team',
    });
    expect(reloaded.messages.length).toBe(before.messages.length + 1);
  });

  it('rechaza un mensaje vacío y no lo escribe', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const before = await patient.loadBootstrap(demoUser.id, 'demo');

    const empty = await persistTeamMessage(patient, demoUser.id, 'demo', {
      id: 'vacio',
      body: '   ',
      at: '2026-10-10T15:01:00.000Z',
    });

    expect(empty).toEqual({ ok: false, reason: 'empty' });
    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.messages).toEqual(before.messages);
  });
});
