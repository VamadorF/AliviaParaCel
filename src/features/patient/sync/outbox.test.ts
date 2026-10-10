import { describe, expect, it } from 'vitest';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import {
  flushOutbox,
  loadOutbox,
  mergePending,
  submitOutbox,
  type OutboxItem,
} from '@/features/patient/sync/outbox';
import type { CheckInRecord } from '@/features/patient/types';
import { CLEAN_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';

const cleanUser = MOCK_USERS.find((user) => user.rut === CLEAN_RUT)!;
const CAPTURED_AT = '2026-10-10T14:30:00.000Z';

function setup() {
  const storage = createMemoryStorage();
  const repository = createMockPatientRepository({ storage, delayMs: 0 });
  return { storage, repository };
}

function checkIn(clientRequestId: string, patch: Partial<CheckInRecord> = {}, at = CAPTURED_AT): OutboxItem {
  return {
    kind: 'checkIn',
    clientRequestId,
    capturedAt: at,
    userId: cleanUser.id,
    profile: 'clean',
    record: {
      id: `local-${clientRequestId}`,
      date: '2026-10-10',
      time: '11:30',
      createdAt: at,
      pain: 4,
      zones: ['Lumbar'],
      emergency: false,
      registrant: 'self',
      doses: [],
      ...patch,
    },
  };
}

function message(clientRequestId: string, body = 'Me duele menos', at = CAPTURED_AT): OutboxItem {
  return {
    kind: 'teamMessage',
    clientRequestId,
    capturedAt: at,
    userId: cleanUser.id,
    profile: 'clean',
    body,
  };
}

describe('MOB-16 · cola sin conexión', () => {
  it('sin red encola el check-in y el mensaje y no los escribe en el repositorio', async () => {
    const { storage, repository } = setup();
    const before = await repository.loadBootstrap(cleanUser.id, 'clean');

    await submitOutbox(storage, repository, false, checkIn('chk-1'));
    await submitOutbox(storage, repository, false, message('msg-1'));
    await submitOutbox(storage, repository, false, checkIn('chk-1'));
    await submitOutbox(storage, repository, false, message('msg-1'));

    const blocked = await flushOutbox(storage, repository, false, cleanUser.id);
    expect(blocked.data).toBeNull();
    expect(blocked.queue.map((item) => item.clientRequestId)).toEqual(['chk-1', 'msg-1']);

    const after = await repository.loadBootstrap(cleanUser.id, 'clean');
    expect(after.checkIns).toEqual(before.checkIns);
    expect(after.messages).toEqual(before.messages);

    const queue = await loadOutbox(storage, cleanUser.id);
    expect(queue).toHaveLength(2);
    const view = mergePending(after, queue);
    expect(view.checkIns[0]).toMatchObject({
      clientRequestId: 'chk-1',
      createdAt: CAPTURED_AT,
      time: '11:30',
      syncStatus: 'pending',
    });
    expect(view.messages[0]).toMatchObject({
      id: 'msg-1',
      at: CAPTURED_AT,
      channel: 'team',
      syncStatus: 'pending',
    });
  });

  it('con red aplica una vez y conserva la hora de captura', async () => {
    const { storage, repository } = setup();

    const sent = await submitOutbox(storage, repository, true, checkIn('chk-1'));
    expect(sent.status).toBe('sent');
    await submitOutbox(storage, repository, false, message('msg-1'));

    const flushed = await flushOutbox(storage, repository, true, cleanUser.id);
    expect(flushed.queue).toEqual([]);
    await flushOutbox(storage, repository, true, cleanUser.id);

    const data = await repository.loadBootstrap(cleanUser.id, 'clean');
    expect(data.checkIns).toHaveLength(1);
    expect(data.checkIns[0]).toMatchObject({
      clientRequestId: 'chk-1',
      createdAt: CAPTURED_AT,
      date: '2026-10-10',
      time: '11:30',
    });
    expect(data.checkIns[0].syncStatus).toBeUndefined();
    expect(data.messages).toHaveLength(1);
    expect(data.messages[0]).toMatchObject({
      id: 'msg-1',
      at: CAPTURED_AT,
      body: 'Me duele menos',
      channel: 'team',
    });
  });

  it('repetir el mismo clientRequestId no duplica', async () => {
    const { storage, repository } = setup();

    await submitOutbox(storage, repository, true, checkIn('chk-1'));
    await submitOutbox(
      storage,
      repository,
      true,
      checkIn('chk-1', { pain: 9 }, '2026-10-11T08:00:00.000Z'),
    );
    await submitOutbox(storage, repository, true, message('msg-1'));
    await submitOutbox(
      storage,
      repository,
      true,
      message('msg-1', 'Otro texto', '2026-10-11T08:00:00.000Z'),
    );

    const data = await repository.loadBootstrap(cleanUser.id, 'clean');
    expect(data.checkIns).toHaveLength(1);
    expect(data.checkIns[0]).toMatchObject({ pain: 4, createdAt: CAPTURED_AT, time: '11:30' });
    expect(data.messages).toHaveLength(1);
    expect(data.messages[0]).toMatchObject({ body: 'Me duele menos', at: CAPTURED_AT });
  });
});
