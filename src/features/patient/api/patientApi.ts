import { MOCK_PATIENT_DELAY_MS } from '@/app/config/constants';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import { asyncStoragePort } from '@/shared/storage/asyncStorageAdapter';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import type { PatientRepository } from '@/features/patient/api/patientRepository';
import type { CheckInRecord, PatientBootstrap } from '@/features/patient/types';

/** Punto de intercambio: sustituir por implementación HTTP real. */
export const patientRepository: PatientRepository = createMockPatientRepository({
  storage: asyncStoragePort,
  delayMs: MOCK_PATIENT_DELAY_MS,
});

export function fetchPatientBootstrap(
  userId: string,
  profile: PatientProfileKind,
): Promise<PatientBootstrap> {
  return patientRepository.loadBootstrap(userId, profile);
}

export function persistPatientBootstrap(
  userId: string,
  data: PatientBootstrap,
): Promise<PatientBootstrap> {
  return patientRepository.saveBootstrap(userId, data);
}

export function appendPatientCheckIn(
  userId: string,
  profile: PatientProfileKind,
  record: CheckInRecord,
): Promise<PatientBootstrap> {
  return patientRepository.appendCheckIn(userId, profile, record);
}

export function resetPatientDemoData(
  userId: string,
  profile: PatientProfileKind,
): Promise<PatientBootstrap> {
  return patientRepository.resetDemoData(userId, profile);
}
