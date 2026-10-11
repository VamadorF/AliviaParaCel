import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import type { AttendanceInput } from '@/features/patient/utils/appointment-attendance';
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
  /** PAC-11 · Confirmación o reprogramación de la consulta vigente. */
  submitAppointmentAttendance: (
    userId: string,
    profile: PatientProfileKind,
    input: AttendanceInput,
  ) => Promise<PatientBootstrap>;
  resetDemoData: (
    userId: string,
    profile: PatientProfileKind,
  ) => Promise<PatientBootstrap>;
  /** MOB-07: aprueba o rechaza una solicitud de vinculación. */
  decideLinkRequest: (
    userId: string,
    profile: PatientProfileKind,
    requestId: string,
    status: 'Aprobado' | 'Rechazado',
  ) => Promise<PatientBootstrap>;
  /** MOB-07: correo y teléfono. Un correo inválido no se guarda. */
  updateContact: (
    userId: string,
    profile: PatientProfileKind,
    email: string,
    phone: string,
  ) => Promise<PatientBootstrap>;
  /** MOB-07: URI local de la foto. */
  setPhoto: (
    userId: string,
    profile: PatientProfileKind,
    photoUri: string | null,
  ) => Promise<PatientBootstrap>;
  /**
   * PAC-15: borra lo no clínico, revoca el consentimiento y deja la ficha en solo lectura.
   */
  requestAccountDeletion: (
    userId: string,
    profile: PatientProfileKind,
  ) => Promise<PatientBootstrap>;
};
