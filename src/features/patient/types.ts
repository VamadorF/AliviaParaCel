import type { CheckInDose } from '@/shared/core/checkin-dose';
import type { CheckInNotes, GiDetail } from '@/shared/core/checkin-row';
import type { ReliefAction } from '@/shared/data/trigger-catalog';

export type { ReliefAction, ReliefLevel } from '@/shared/data/trigger-catalog';

export type MedicationStatus = 'activo' | 'suspendido' | 'finalizado';

export type Medication = {
  id: string;
  /** Nombre comercial o genÃ©rico, sin concentraciÃ³n (ej. "Paracetamol"). */
  name: string;
  /** ConcentraciÃ³n (ej. "500 mg"). */
  concentration: string;
  /** Forma farmacÃ©utica (ej. "Comprimido"). */
  form: string;
  /** Cantidad por toma (ej. "1 comprimido"). */
  quantity: string;
  /** VÃ­a de administraciÃ³n (ej. "Oral"). */
  route: string;
  /** Frecuencia (ej. "Cada 8 horas"). */
  frequency: string;
  /** DuraciÃ³n del tratamiento (ej. "30 dÃ­as", "Uso continuo"). */
  duration: string;
  status: MedicationStatus;
};

export type DoseChoice = 'indicated' | 'more' | 'less' | 'skipped';

export type CheckInRecord = {
  id: string;
  date: string;
  time: string;
  pain: number;
  zones: string[];
  mood?: string;
  sleep?: string;
  emergency: boolean;
  registrant: 'self' | 'caregiver';
  doses: { medId: string; choice: DoseChoice }[];
  /** Atribuciones antiguas en texto libre. Los registros viejos solo traen esto. */
  why?: string[];
  /** DIF-01 · Gatillantes: ids del catálogo (`estres`, …) o `otro:<texto>`. */
  triggers?: string[];
  /** DIF-01 · Acciones de alivio con el alivio que reportó el paciente. */
  reliefActions?: ReliefAction[];
  /** Versión del catálogo con que se clasificó el registro. */
  catalogVersion?: string;
  /**
   * MOB-04 · Campos de paridad con la web. Todos opcionales: los registros antiguos no los traen.
   * `toCheckInRow()` (utils/checkin.ts) los junta con los de arriba en un `CheckInRow` de la web.
   */
  /** Instante de captura en ISO 8601. */
  createdAt?: string;
  /** Urgencias: motivo y "qué pasó" (solo si `emergency`). */
  emergencyReason?: string;
  emergencyDetail?: string;
  /** Cuidador (solo si `registrant === 'caregiver'`). */
  caregiverName?: string;
  caregiverRelation?: string;
  /** Dosis con motivo y cantidad, en la misma forma que la web. */
  doseDetails?: CheckInDose[];
  /** Efecto adverso que el paciente quiere consultar con su equipo. */
  adverseNote?: string;
  /** Síntomas digestivos (náuseas, vómitos, deposiciones, apetito, reflujo). */
  giDetail?: GiDetail;
  /** Texto libre por sección. */
  notes?: CheckInNotes;
  /**
   * MOB-06 · `false` = registrado con el consentimiento revocado: queda solo en el teléfono y no se
   * comparte con el equipo. Ausente = compartido (registros anteriores a MOB-06).
   */
  sharedWithTeam?: boolean;
};

export type Appointment = {
  id: string;
  scheduledAt: string;
  doctorName: string;
  reason?: string;
  status: 'Pendiente' | 'Confirmada';
};

export type TeamInstruction = {
  text: string;
  date: string;
};

export type Message = {
  id: string;
  from: 'patient' | 'team' | 'alivia';
  body: string;
  at: string;
};

export type ForumPost = {
  id: string;
  author: string;
  excerpt: string;
  at: string;
};

/** MOB-06 · Misma forma que ConsentState / ConsentEventRow de la web (PAC-02), sin RUT: el bootstrap ya es del paciente. */
export type ConsentAction = 'aceptado' | 'revocado';

export type ConsentState = {
  status: ConsentAction;
  /** Versión del texto de consentimiento aceptado o revocado. */
  version: string;
  /** Fecha real (ISO 8601) del último cambio. */
  updatedAt: string;
};

export type ConsentEvent = {
  id: string;
  action: ConsentAction;
  version: string;
  createdAt: string;
};

export type PatientBootstrap = {
  medications: Medication[];
  checkIns: CheckInRecord[];
  appointment: Appointment | null;
  instruction: TeamInstruction | null;
  messages: Message[];
  posts: ForumPost[];
  messagingEnabled: boolean;
  doctorLinked: boolean;
  /** MOB-06 · Opcional: sin registro se asume aceptado, sin fecha (nunca se inventa una). */
  consent?: ConsentState;
  /** MOB-06 · Historial append-only, del más reciente al más antiguo. */
  consentHistory?: ConsentEvent[];
};
