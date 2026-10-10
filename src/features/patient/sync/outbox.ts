import type { PatientRepository } from '@/features/patient/api/patientRepository';
import { persistTeamMessage } from '@/features/patient/messaging/teamMessage';
import type { CheckInRecord, Message, PatientBootstrap } from '@/features/patient/types';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import type { StoragePort } from '@/shared/storage/storagePort';

const STORAGE_PREFIX = '@alivia/outbox/v1/';

export type OutboxItem = {
  clientRequestId: string;
  /** ISO 8601 del momento en que la persona lo registró. No se reemplaza al sincronizar. */
  capturedAt: string;
  userId: string;
  profile: PatientProfileKind;
} & (
  | { kind: 'checkIn'; record: CheckInRecord }
  | { kind: 'teamMessage'; body: string }
);

type OutboxRepository = Pick<PatientRepository, 'loadBootstrap' | 'saveBootstrap' | 'appendCheckIn'>;

export type SubmitResult =
  | { status: 'pending'; queue: OutboxItem[] }
  | { status: 'sent'; data: PatientBootstrap; queue: OutboxItem[] };

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function newClientRequestId(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (randomUUID) return randomUUID();
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isOutboxItem(value: unknown): value is OutboxItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as OutboxItem;
  if (!item.clientRequestId || typeof item.capturedAt !== 'string' || typeof item.userId !== 'string') {
    return false;
  }
  if (item.profile !== 'demo' && item.profile !== 'clean') return false;
  if (item.kind === 'teamMessage') return typeof item.body === 'string';
  if (item.kind === 'checkIn') {
    return Boolean(item.record && typeof item.record.id === 'string' && typeof item.record.date === 'string');
  }
  return false;
}

export async function loadOutbox(storage: StoragePort, userId: string): Promise<OutboxItem[]> {
  const raw = await storage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isOutboxItem);
  } catch {
    return [];
  }
}

export async function saveOutbox(storage: StoragePort, userId: string, items: OutboxItem[]): Promise<void> {
  const key = storageKey(userId);
  if (items.length === 0) {
    await storage.removeItem(key);
    return;
  }
  await storage.setItem(key, JSON.stringify(items));
}

function enqueue(items: OutboxItem[], item: OutboxItem): OutboxItem[] {
  if (items.some((current) => current.clientRequestId === item.clientRequestId)) return items;
  return [...items, item];
}

function checkInForRepository(item: Extract<OutboxItem, { kind: 'checkIn' }>): CheckInRecord {
  const { syncStatus: _pending, ...record } = item.record;
  return {
    ...record,
    clientRequestId: item.clientRequestId,
    createdAt: item.capturedAt,
  };
}

async function applyOutboxItem(repository: OutboxRepository, item: OutboxItem): Promise<PatientBootstrap> {
  if (item.kind === 'teamMessage') {
    const result = await persistTeamMessage(repository, item.userId, item.profile, {
      id: item.clientRequestId,
      body: item.body,
      at: item.capturedAt,
    });
    if (!result.ok) return repository.loadBootstrap(item.userId, item.profile);
    return result.data;
  }
  const current = await repository.loadBootstrap(item.userId, item.profile);
  if (current.checkIns.some((record) => record.clientRequestId === item.clientRequestId)) {
    return current;
  }
  return repository.appendCheckIn(item.userId, item.profile, checkInForRepository(item));
}

export async function submitOutbox(
  storage: StoragePort,
  repository: OutboxRepository,
  online: boolean,
  item: OutboxItem,
): Promise<SubmitResult> {
  if (!online) {
    const queue = enqueue(await loadOutbox(storage, item.userId), item);
    await saveOutbox(storage, item.userId, queue);
    return { status: 'pending', queue };
  }
  const data = await applyOutboxItem(repository, item);
  const queue = (await loadOutbox(storage, item.userId)).filter(
    (current) => current.clientRequestId !== item.clientRequestId,
  );
  await saveOutbox(storage, item.userId, queue);
  return { status: 'sent', data, queue };
}

export async function flushOutbox(
  storage: StoragePort,
  repository: OutboxRepository,
  online: boolean,
  userId: string,
): Promise<{ data: PatientBootstrap | null; queue: OutboxItem[] }> {
  if (!online) return { data: null, queue: await loadOutbox(storage, userId) };

  let data: PatientBootstrap | null = null;
  const applied = new Set<string>();
  for (let pass = 0; pass < 3; pass++) {
    const fresh = (await loadOutbox(storage, userId)).filter((item) => !applied.has(item.clientRequestId));
    if (fresh.length === 0) break;
    for (const item of fresh) {
      data = await applyOutboxItem(repository, item);
      applied.add(item.clientRequestId);
    }
  }
  const queue = (await loadOutbox(storage, userId)).filter((item) => !applied.has(item.clientRequestId));
  await saveOutbox(storage, userId, queue);
  return { data, queue };
}

/** Junta la cola al bootstrap solo para mostrarla. No escribe el repositorio. */
export function mergePending(data: PatientBootstrap, queue: readonly OutboxItem[]): PatientBootstrap {
  const seenChecks = new Set<string>();
  for (const record of data.checkIns) {
    seenChecks.add(record.id);
    if (record.clientRequestId) seenChecks.add(record.clientRequestId);
  }
  const seenMessages = new Set(data.messages.map((message) => message.id));
  const checks: CheckInRecord[] = [];
  const messages: Message[] = [];

  for (const item of queue) {
    if (item.kind === 'checkIn') {
      if (seenChecks.has(item.clientRequestId) || seenChecks.has(item.record.id)) continue;
      seenChecks.add(item.clientRequestId);
      seenChecks.add(item.record.id);
      checks.push({ ...checkInForRepository(item), syncStatus: 'pending' });
      continue;
    }
    if (seenMessages.has(item.clientRequestId)) continue;
    seenMessages.add(item.clientRequestId);
    messages.push({
      id: item.clientRequestId,
      from: 'patient',
      body: item.body,
      at: item.capturedAt,
      channel: 'team',
      syncStatus: 'pending',
    });
  }

  if (checks.length === 0 && messages.length === 0) return data;
  return {
    ...data,
    checkIns: checks.reverse().concat(data.checkIns),
    messages: data.messages.concat(messages),
  };
}
