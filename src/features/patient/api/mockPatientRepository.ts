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
import { applyConsent, stampSharing } from '@/features/patient/utils/consent';

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
      const next = cloneBootstrap(data);
      await storage.setItem(storageKey(userId), JSON.stringify(next));
      return next;
    },

    async appendCheckIn(userId, profile, record) {
      await wait();
      const current = await readOrSeed(userId, profile);
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
      const next = applyConsent(current, action, at);
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
  };
}
