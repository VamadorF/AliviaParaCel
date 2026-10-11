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
  /** MOB-16 · Idempotencia del envío. El mismo id no se vuelve a escribir. */
  clientRequestId?: string;
  /** MOB-16 · Ausente = ya está en el repositorio. `pending` solo vive en la cola visible. */
  syncStatus?: 'pending';
  /** MOB-17 · Check-in rápido. Ausente = registro por pasos. */
  quick?: boolean;
};

/** PAC-10 · PGIC: 1 = muchísimo mejor … 4 = sin cambios … 7 = muchísimo peor. */
export type PgicValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Una preparación por consulta. No es un registro diario. */
export type PreConsult = {
  appointmentId: string;
  topics: string;
  pgic: PgicValue;
  functionalGoal: string;
  answeredAt: string;
};

export type PreConsultInput = {
  topics: string;
  pgic: PgicValue | null;
  functionalGoal: string;
};

export type Appointment = {
  id: string;
  scheduledAt: string;
  doctorName: string;
  reason?: string;
  status: 'Pendiente' | 'Confirmada';
  /** Ausente o null: el paciente no respondió. La consulta sigue igual. */
  preConsult?: PreConsult | null;
};

export type TeamInstruction = {
  /** Id de la instrucción vigente. En la web es el id de la alerta. */
  id: number;
  text: string;
  date: string;
};

/** PAC-08 · Acuse de lectura. El celular no tiene ficha de médico: queda en el mock del paciente. */
export type InstructionAck = {
  alertId: number;
  readAt: string;
};

export type Message = {
  id: string;
  from: 'patient' | 'team' | 'alivia';
  body: string;
  at: string;
  /** MOB-10 · Canal explícito. Ausente en mensajes anteriores: se infiere por `from`. */
  channel?: 'assistant' | 'team';
  /** MOB-16 · Ausente = ya está en el repositorio. */
  syncStatus?: 'pending';
};

export type ForumPost = {
  id: string;
  author: string;
  excerpt: string;
  at: string;
  /** MOB-11 · Ausente o null: tema. Si tiene id, es una respuesta a ese tema. */
  parentId?: string | null;
  /** COM-01 · Ausente = visible. true = ocultada; en el móvil se marca en el fixture o con hideCommunityPost. */
  hidden?: boolean;
  /** COM-01 · Reportes recibidos. Ausente = ninguno. */
  reportCount?: number;
  /** COM-06 · Ausente = visible para la comunidad. `en_revision` solo la ve quien la escribió. */
  review?: 'en_revision';
};

/** COM-01 · Misma forma que ForumReportRow de la web. La cola de moderación no vive en el móvil. */
export type ForumReport = {
  id: string;
  postId: string;
  reporterRut: string;
  reason: string;
  status: 'abierto' | 'resuelto';
  createdAt: string;
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

/** MOB-19 · Clínica del paciente en los fixtures. Sin teléfono, el centro no se muestra. */
export type PatientClinic = {
  name: string;
  phone?: string | null;
};

/** MOB-07 · Médico del equipo. `expiresAt` solo si el vínculo es temporal. */
export type CareTeamMember = {
  id: string;
  name: string;
  specialty: string;
  /** ISO 8601. Ausente o null: vínculo permanente, sin fecha de término. */
  expiresAt?: string | null;
  /**
   * CLI-08 · El médico aceptó sumarse. El perfil avisa mientras el vínculo siga vigente.
   * Ausente: ya estaba en el equipo y no se muestra el aviso de ingreso.
   */
  newlyAccepted?: true;
};

export type LinkRequestStatus = 'Pendiente' | 'Aprobado' | 'Rechazado';

/** MOB-07 · Solicitud de vinculación. Misma decisión que la web: Aprobado o Rechazado. */
export type LinkRequest = {
  id: string;
  requesterName: string;
  requesterRut: string;
  requesterRole: 'medico' | 'organizacion';
  specialty?: string;
  status: LinkRequestStatus;
  createdAt: string;
  /** Si se aprueba y el acceso es temporal, el equipo queda con esta fecha. */
  expiresAt?: string | null;
};

export type PatientBootstrap = {
  medications: Medication[];
  checkIns: CheckInRecord[];
  appointment: Appointment | null;
  instruction: TeamInstruction | null;
  /** PAC-08 · Acuses ya registrados. Ausente = ninguna instrucción leída. */
  instructionAcks?: InstructionAck[];
  messages: Message[];
  posts: ForumPost[];
  /** COM-01 · Ausente = ningún reporte. */
  forumReports?: ForumReport[];
  messagingEnabled: boolean;
  doctorLinked: boolean;
  /** MOB-19 · Ausente o sin teléfono: no se muestra el teléfono del centro. */
  clinic?: PatientClinic | null;
  /** MOB-06 · Opcional: sin registro se asume aceptado, sin fecha (nunca se inventa una). */
  consent?: ConsentState;
  /** MOB-06 · Historial append-only, del más reciente al más antiguo. */
  consentHistory?: ConsentEvent[];
  /** MOB-07 · Patología de la ficha. Ausente o null: el paciente nuevo no tiene. */
  pathology?: string | null;
  /** MOB-07 · Correo editable. El RUT y el nombre viven en la cuenta y no se editan aquí. */
  email?: string;
  phone?: string;
  /** MOB-07 · URI local de la foto. No es una URL de servidor. */
  photoUri?: string | null;
  /** MOB-07 · Equipo tratante. Ausente = ninguno. */
  team?: CareTeamMember[];
  /** MOB-07 · Solicitudes de vinculación. Ausente = ninguna. */
  linkRequests?: LinkRequest[];
  /**
   * PAC-15 · Ausente = cuenta vigente. Si está, la ficha quedó solo lectura.
   * El texto es "Cuenta del paciente eliminada".
   */
  readOnlyReason?: string;
};
