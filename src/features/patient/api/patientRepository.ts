import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import type { CheckInRecord, ConsentAction, PatientBootstrap } from '@/features/patient/types';

export type PatientRepository = {
  loadBootstrap: (
    userId: string,
    profile: PatientProfileKind,
  ) => Promise<PatientBootstrap>;
  saveBootstrap: (
    userId: string,
    data: PatientBootstrap,
  ) => Promise<PatientBootstrap>;
  appendCheckIn: (
    userId: string,
    profile: PatientProfileKind,
    record: CheckInRecord,
  ) => Promise<PatientBootstrap>;
  /** MOB-06: acepta o revoca el consentimiento; `at` es la fecha real (ISO 8601). */
  setConsent: (
    userId: string,
    profile: PatientProfileKind,
    action: ConsentAction,
    at: string,
  ) => Promise<PatientBootstrap>;
  resetDemoData: (
    userId: string,
    profile: PatientProfileKind,
  ) => Promise<PatientBootstrap>;
};
