import {
  CLEAN_BOOTSTRAP,
  DEMO_BOOTSTRAP,
  cloneBootstrap,
  fixtureForProfile,
} from '@/shared/mocks/patient.mock';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import type { StoragePort } from '@/shared/storage/storagePort';
import type { PatientBootstrap } from '@/features/patient/types';
import type { PatientRepository } from '@/features/patient/api/patientRepository';
import { applyAppointmentAttendance } from '@/features/patient/utils/appointment-attendance';
import { applyConsent, stampSharing } from '@/features/patient/utils/consent';
import { acknowledgeInstruction } from '@/features/patient/utils/instruction-ack';
import { submitPreConsult as applyPreConsult } from '@/features/patient/utils/pre-consult';
import {
  applyContact,
  applyPhoto,
  decideLinkRequest as applyLinkDecision,
  requestAccountDeletion as applyAccountDeletion,
} from '@/features/patient/utils/profile';
import { reminderStorageKey } from '@/features/patient/notifications/reminders';
import { outboxStorageKey } from '@/features/patient/sync/outbox';
import { findUserById } from '@/shared/mocks/users.mock';

const STORAGE_PREFIX = '@alivia/patient-bootstrap/v1/';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function parseBootstrap(raw: string): PatientBootstrap | null {
  try {
    const parsed = JSON.parse(raw) as PatientBootstrap;
    if (!parsed || !Array.isArray(parsed.checkIns)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isReadOnly(data: PatientBootstrap) {
  return Boolean(data.readOnlyReason);
}

export type MockPatientRepositoryOptions = {
  storage: StoragePort;
  delayMs: number;
};

export function createMockPatientRepository({
  storage,
  delayMs,
}: MockPatientRepositoryOptions): PatientRepository {
  const wait = () =>
    delayMs > 0 ? new Promise((r) => setTimeout(r, delayMs)) : Promise.resolve();

  async function readOrSeed(
    userId: string,
    profile: PatientProfileKind,
  ): Promise<PatientBootstrap> {
    const raw = await storage.getItem(storageKey(userId));
    if (raw) {
      const stored = parseBootstrap(raw);
      if (stored) return cloneBootstrap(stored);
    }
    const seeded = fixtureForProfile(profile);
    await storage.setItem(storageKey(userId), JSON.stringify(seeded));
    return cloneBootstrap(seeded);
  }

  return {
    async loadBootstrap(userId, profile) {
      await wait();
      return readOrSeed(userId, profile);
    },

    async saveBootstrap(userId, data) {
      await wait();
      const stored = parseBootstrap((await storage.getItem(storageKey(userId))) ?? '');
      if (stored && isReadOnly(stored)) return cloneBootstrap(stored);
      const next = cloneBootstrap(data);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return next;
    },

    async appendCheckIn(userId, profile, record) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      // MOB-06: con el consentimiento revocado el registro queda en el teléfono, marcado como no compartido.
      const next = {
        ...current,
        checkIns: [stampSharing(record, current), ...current.checkIns],
      };
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return cloneBootstrap(next);
    },

    async setConsent(userId, profile, action, at) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      const next = applyConsent(current, action, at);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return cloneBootstrap(next);
    },

    async acknowledgeInstruction(userId, profile, at) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      const next = acknowledgeInstruction(current, at);
      if (next === current) return cloneBootstrap(current);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return cloneBootstrap(next);
    },

    async submitPreConsult(userId, profile, input, at) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      const next = applyPreConsult(current, input, at);
      if (next === current) return cloneBootstrap(current);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return cloneBootstrap(next);
    },

    async submitAppointmentAttendance(userId, profile, input) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      const next = applyAppointmentAttendance(current, input);
      if (next === current) return cloneBootstrap(current);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return cloneBootstrap(next);
    },

    async resetDemoData(userId, profile) {
      await wait();
      const fixture = profile === 'demo' ? DEMO_BOOTSTRAP : CLEAN_BOOTSTRAP;
      const next = cloneBootstrap(fixture);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return next;
    },

    async decideLinkRequest(userId, profile, requestId, status) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      const next = applyLinkDecision(current, requestId, status);
      if (next === current) return cloneBootstrap(current);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return cloneBootstrap(next);
    },

    async updateContact(userId, profile, email, phone) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      const result = applyContact(current, email, phone);
      if (!result.ok || result.next === current) return cloneBootstrap(current);
      await storage.setItem(storageKey(userId), JSON.stringify(result.next));
      return cloneBootstrap(result.next);
    },

    async setPhoto(userId, profile, photoUri) {
      await wait();
      const current = await readOrSeed(userId, profile);
      if (isReadOnly(current)) return cloneBootstrap(current);
      const next = applyPhoto(current, photoUri);
      if (next === current) return cloneBootstrap(current);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return cloneBootstrap(next);
    },

    async requestAccountDeletion(userId, profile) {
      await wait();
      const current = await readOrSeed(userId, profile);
      const user = findUserById(userId);
      const next = applyAccountDeletion(current, {
        authorName: user?.name ?? '',
        reporterRut: user?.rut,
        at: new Date().toISOString(),
      });
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      await storage.removeItem(reminderStorageKey(userId));
      await storage.removeItem(outboxStorageKey(userId));
      return cloneBootstrap(next);
    },
  };
}
