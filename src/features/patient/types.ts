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

export type PatientBootstrap = {
  medications: Medication[];
  checkIns: CheckInRecord[];
  appointment: Appointment | null;
  instruction: TeamInstruction | null;
  messages: Message[];
  posts: ForumPost[];
  messagingEnabled: boolean;
  doctorLinked: boolean;
};
