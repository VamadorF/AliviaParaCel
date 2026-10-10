import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import type {
  CheckInRecord,
  ConsentAction,
  PatientBootstrap,
  PreConsultInput,
} from '@/features/patient/types';

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
  /** PAC-08: acusa la instrucción vigente; `at` es la fecha real (ISO 8601). Idempotente. */
  acknowledgeInstruction: (
    userId: string,
    profile: PatientProfileKind,
    at: string,
  ) => Promise<PatientBootstrap>;
  /**
   * PAC-10: guarda la preparación de la consulta vigente.
   * `at` es la fecha real (ISO 8601) y el "ahora" del cálculo de 48 h.
   * Si ya hay respuesta para esa consulta, devuelve la misma (no duplica ni pisa).
   */
  submitPreConsult: (
    userId: string,
    profile: PatientProfileKind,
    input: PreConsultInput,
    at: string,
  ) => Promise<PatientBootstrap>;
  resetDemoData: (
    userId: string,
    profile: PatientProfileKind,
  ) => Promise<PatientBootstrap>;
};
