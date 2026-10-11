import { MOCK_PATIENT_DELAY_MS } from '@/app/config/constants';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import { asyncStoragePort } from '@/shared/storage/asyncStorageAdapter';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import type { PatientRepository } from '@/features/patient/api/patientRepository';
import type { ConsentAction, PatientBootstrap, PreConsultInput } from '@/features/patient/types';

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

export function setPatientConsent(
  userId: string,
  profile: PatientProfileKind,
  action: ConsentAction,
  at: string,
): Promise<PatientBootstrap> {
  return patientRepository.setConsent(userId, profile, action, at);
}

export function acknowledgePatientInstruction(
  userId: string,
  profile: PatientProfileKind,
  at: string,
): Promise<PatientBootstrap> {
  return patientRepository.acknowledgeInstruction(userId, profile, at);
}

export function submitPatientPreConsult(
  userId: string,
  profile: PatientProfileKind,
  input: PreConsultInput,
  at: string,
): Promise<PatientBootstrap> {
  return patientRepository.submitPreConsult(userId, profile, input, at);
}

export function resetPatientDemoData(
  userId: string,
  profile: PatientProfileKind,
): Promise<PatientBootstrap> {
  return patientRepository.resetDemoData(userId, profile);
}

export function decidePatientLinkRequest(
  userId: string,
  profile: PatientProfileKind,
  requestId: string,
  status: 'Aprobado' | 'Rechazado',
): Promise<PatientBootstrap> {
  return patientRepository.decideLinkRequest(userId, profile, requestId, status);
}

export function updatePatientContact(
  userId: string,
  profile: PatientProfileKind,
  email: string,
  phone: string,
): Promise<PatientBootstrap> {
  return patientRepository.updateContact(userId, profile, email, phone);
}

export function setPatientPhoto(
  userId: string,
  profile: PatientProfileKind,
  photoUri: string | null,
): Promise<PatientBootstrap> {
  return patientRepository.setPhoto(userId, profile, photoUri);
}

export function requestPatientAccountDeletion(
  userId: string,
  profile: PatientProfileKind,
): Promise<PatientBootstrap> {
  return patientRepository.requestAccountDeletion(userId, profile);
}
