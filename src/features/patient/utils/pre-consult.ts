import type {
  Appointment,
  PatientBootstrap,
  PgicValue,
  PreConsult,
  PreConsultInput,
} from '@/features/patient/types';

/**
 * Preparación de la consulta (PAC-10).
 * Una medición por consulta, no un registro diario. Fundamento IMMPACT;
 * la interfaz no cita el artículo.
 * PGIC: 1 = muchísimo mejor … 4 = sin cambios … 7 = muchísimo peor.
 * Si el paciente no responde, el check-in y el Diario siguen igual.
 */
export const PRE_CONSULT_WINDOW_MS = 48 * 60 * 60 * 1000;

export const PGIC_OPTIONS: { value: PgicValue; label: string }[] = [
  { value: 1, label: 'Muchísimo mejor' },
  { value: 2, label: 'Mucho mejor' },
  { value: 3, label: 'Un poco mejor' },
  { value: 4, label: 'Sin cambios' },
  { value: 5, label: 'Un poco peor' },
  { value: 6, label: 'Mucho peor' },
  { value: 7, label: 'Muchísimo peor' },
];

export type PreConsultSlot = 'form' | 'answers' | 'none';

function pgicLabel(value: PgicValue): string {
  return PGIC_OPTIONS.find((option) => option.value === value)?.label ?? 'Sin impresión';
}

function msUntil(scheduledAt: string, nowMs: number): number | null {
  const at = new Date(scheduledAt).getTime();
  return Number.isFinite(at) ? at - nowMs : null;
}

function pgicOf(value: number | null): PgicValue | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 7) return null;
  return value as PgicValue;
}

/** Respuesta ya guardada para esta consulta, o null si no hay. */
export function preConsultOf(appointment: Appointment | null | undefined): PreConsult | null {
  const row = appointment?.preConsult;
  if (!appointment || !row || row.appointmentId !== appointment.id) return null;
  return row;
}

/** El formulario se habilita cuando faltan 48 h o menos y la consulta aún no empieza. */
export function preConsultOpen(scheduledAt: string, nowMs: number): boolean {
  const left = msUntil(scheduledAt, nowMs);
  return left != null && left >= 0 && left <= PRE_CONSULT_WINDOW_MS;
}

/**
 * Qué pinta el Diario junto a la consulta.
 * `none` = no se muestra el formulario (faltan más de 48 h, ya empezó, o no hay consulta).
 */
export function preConsultSlot(
  appointment: Appointment | null | undefined,
  nowMs: number,
): PreConsultSlot {
  if (!appointment) return 'none';
  if (preConsultOf(appointment)) return 'answers';
  if (preConsultOpen(appointment.scheduledAt, nowMs)) return 'form';
  return 'none';
}

export function preConsultParts(
  row: Pick<PreConsult, 'topics' | 'pgic' | 'functionalGoal'>,
): { label: string; value: string }[] {
  return [
    { label: 'Qué tratar', value: row.topics },
    { label: 'Cambio', value: pgicLabel(row.pgic) },
    { label: 'Objetivo', value: row.functionalGoal },
  ];
}

/**
 * Guarda una preparación. Fuera de las 48 h no escribe.
 * Si esa consulta ya tiene respuesta, devuelve el mismo objeto (no duplica ni pisa).
 */
export function submitPreConsult(
  data: PatientBootstrap,
  input: PreConsultInput,
  at: string,
): PatientBootstrap {
  const appointment = data.appointment;
  const answeredAt = at.trim();
  const nowMs = new Date(answeredAt).getTime();
  if (!appointment || !answeredAt || !Number.isFinite(nowMs)) return data;
  if (preConsultOf(appointment)) return data;
  if (!preConsultOpen(appointment.scheduledAt, nowMs)) return data;

  const topics = input.topics.trim();
  const functionalGoal = input.functionalGoal.trim();
  const pgic = pgicOf(input.pgic);
  if (!topics || !pgic || !functionalGoal) return data;

  return {
    ...data,
    appointment: {
      ...appointment,
      preConsult: {
        appointmentId: appointment.id,
        topics,
        pgic,
        functionalGoal,
        answeredAt,
      },
    },
  };
}
