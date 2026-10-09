import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import type { CheckInRecord, PatientBootstrap } from '@/features/patient/types';

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
  resetDemoData: (
    userId: string,
    profile: PatientProfileKind,
  ) => Promise<PatientBootstrap>;
};
