import { medicationTitle } from '@/features/patient/utils/medications';
import type { StoragePort } from '@/shared/storage/storagePort';

/** Hora en reloj de 24 h del paciente. */
export type Clock = { hour: number; minute: number };

export type MedicationReminder = {
  enabled: boolean;
  time: Clock;
};

export type QuietHours = {
  enabled: boolean;
  /** Inclusivo. */
  start: Clock;
  /** Exclusivo. Si es menor que el inicio, el silencio cruza la medianoche. */
  end: Clock;
};

export type ReminderSettings = {
  dailyEnabled: boolean;
  dailyTime: Clock;
  /** Ausente = ese medicamento no tiene aviso. */
  medications: Record<string, MedicationReminder>;
  appointmentEnabled: boolean;
  quiet: QuietHours;
};

export type ReminderMedication = {
  id: string;
  name: string;
  status: string;
};

export type ReminderAppointment = {
  id: string;
  scheduledAt: string;
  doctorName: string;
  reason?: string;
};

export type PlannedReminder = {
  id: string;
  title: string;
  body: string;
  trigger: { type: 'daily'; hour: number; minute: number } | { type: 'date'; at: string };
};

export type AppointmentDecision =
  | { status: 'off' | 'missing' | 'invalid' | 'passed' | 'silenced' }
  | { status: 'scheduled'; at: string; body: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = '@alivia/reminders/v1/';

export const DEFAULT_MEDICATION_TIME: Clock = { hour: 8, minute: 0 };

export function defaultReminderSettings(): ReminderSettings {
  return {
    dailyEnabled: true,
    dailyTime: { hour: 9, minute: 0 },
    medications: {},
    appointmentEnabled: true,
    quiet: {
      enabled: true,
      start: { hour: 22, minute: 0 },
      end: { hour: 7, minute: 0 },
    },
  };
}

export function reminderStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function minutesOf(clock: Clock) {
  return clock.hour * 60 + clock.minute;
}

export function formatClock(clock: Clock) {
  return `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
}

/** Acepta `9:00` y `09:00`. */
export function parseClock(text: string): Clock | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function isQuietMinute(minute: number, quiet: QuietHours) {
  if (!quiet.enabled) return false;
  const start = minutesOf(quiet.start);
  const end = minutesOf(quiet.end);
  if (start === end) return false;
  if (start < end) return minute >= start && minute < end;
  return minute >= start || minute < end;
}

export function isQuietClock(clock: Clock, quiet: QuietHours) {
  return isQuietMinute(minutesOf(clock), quiet);
}

export function reminderMedications(
  meds: { id: string; name: string; concentration?: string; status: string }[],
): ReminderMedication[] {
  return meds.map((med) => ({
    id: med.id,
    name: medicationTitle({ name: med.name, concentration: med.concentration ?? '' }),
    status: med.status,
  }));
}

export function medicationChoice(settings: ReminderSettings, medId: string): MedicationReminder {
  const saved = settings.medications[medId];
  if (!saved) return { enabled: false, time: { ...DEFAULT_MEDICATION_TIME } };
  return { enabled: saved.enabled, time: { ...saved.time } };
}

function appointmentBody(appointment: ReminderAppointment) {
  const who = appointment.doctorName.trim();
  const why = appointment.reason?.trim();
  if (who && why) return `Mañana tienes consulta con ${who}: ${why}.`;
  if (who) return `Mañana tienes consulta con ${who}.`;
  return 'Mañana tienes una consulta agendada.';
}

/** 24 h antes de la consulta. Si esa hora cae en el silencio, no se programa. */
export function decideAppointment(
  enabled: boolean,
  appointment: ReminderAppointment | null,
  quiet: QuietHours,
  now: Date,
): AppointmentDecision {
  if (!enabled) return { status: 'off' };
  if (!appointment) return { status: 'missing' };
  const visit = new Date(appointment.scheduledAt);
  if (Number.isNaN(visit.getTime())) return { status: 'invalid' };
  if (visit.getTime() <= now.getTime()) return { status: 'passed' };

  const ideal = new Date(visit.getTime() - DAY_MS);
  if (ideal.getTime() <= now.getTime()) return { status: 'passed' };
  if (isQuietMinute(ideal.getHours() * 60 + ideal.getMinutes(), quiet)) return { status: 'silenced' };
  return {
    status: 'scheduled',
    at: ideal.toISOString(),
    body: appointmentBody(appointment),
  };
}

export function dailyReminderId() {
  return 'alivia-daily';
}

export function medicationReminderId(medId: string) {
  return `alivia-med-${medId.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

export function appointmentReminderId(appointmentId: string) {
  return `alivia-appt-${appointmentId.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

/** Qué avisos locales hay que programar. No habla con el sistema. */
export function planLocalReminders(input: {
  settings: ReminderSettings;
  medications: ReminderMedication[];
  appointment: ReminderAppointment | null;
  now: Date;
}): PlannedReminder[] {
  const { settings, medications, appointment, now } = input;
  const planned: PlannedReminder[] = [];

  if (settings.dailyEnabled && !isQuietClock(settings.dailyTime, settings.quiet)) {
    planned.push({
      id: dailyReminderId(),
      title: 'Registro de hoy',
      body: 'Es la hora que elegiste para anotar cómo estás.',
      trigger: { type: 'daily', hour: settings.dailyTime.hour, minute: settings.dailyTime.minute },
    });
  }

  for (const med of medications) {
    if (med.status !== 'activo') continue;
    const choice = medicationChoice(settings, med.id);
    if (!choice.enabled || isQuietClock(choice.time, settings.quiet)) continue;
    const safeId = med.id.replace(/[^A-Za-z0-9_-]/g, '_');
    if (!safeId) continue;
    const name = med.name.trim() || 'tu medicamento';
    planned.push({
      id: medicationReminderId(med.id),
      title: 'Medicamento',
      body: `Recordatorio: ${name}.`,
      trigger: { type: 'daily', hour: choice.time.hour, minute: choice.time.minute },
    });
  }

  const visit = decideAppointment(settings.appointmentEnabled, appointment, settings.quiet, now);
  if (visit.status === 'scheduled' && appointment) {
    const safeId = appointment.id.replace(/[^A-Za-z0-9_-]/g, '_');
    if (safeId) {
      planned.push({
        id: appointmentReminderId(appointment.id),
        title: 'Consulta',
        body: visit.body,
        trigger: { type: 'date', at: visit.at },
      });
    }
  }

  return planned;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clockFrom(value: unknown, fallback: Clock): Clock {
  if (!isRecord(value)) return { ...fallback };
  const hour = value.hour;
  const minute = value.minute;
  if (typeof hour !== 'number' || typeof minute !== 'number') return { ...fallback };
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return { ...fallback };
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return { ...fallback };
  return { hour, minute };
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeReminderSettings(value: unknown): ReminderSettings {
  const base = defaultReminderSettings();
  if (!isRecord(value)) return base;
  const medications: Record<string, MedicationReminder> = {};
  if (isRecord(value.medications)) {
    for (const [id, item] of Object.entries(value.medications)) {
      if (!id || !isRecord(item)) continue;
      medications[id] = {
        enabled: item.enabled === true,
        time: clockFrom(item.time, DEFAULT_MEDICATION_TIME),
      };
    }
  }
  const quiet = isRecord(value.quiet) ? value.quiet : null;
  return {
    dailyEnabled: flag(value.dailyEnabled, base.dailyEnabled),
    dailyTime: clockFrom(value.dailyTime, base.dailyTime),
    medications,
    appointmentEnabled: flag(value.appointmentEnabled, base.appointmentEnabled),
    quiet: quiet
      ? {
          enabled: flag(quiet.enabled, base.quiet.enabled),
          start: clockFrom(quiet.start, base.quiet.start),
          end: clockFrom(quiet.end, base.quiet.end),
        }
      : base.quiet,
  };
}

export async function loadReminderSettings(storage: StoragePort, userId: string) {
  const raw = await storage.getItem(reminderStorageKey(userId));
  if (!raw) return defaultReminderSettings();
  try {
    return normalizeReminderSettings(JSON.parse(raw));
  } catch {
    return defaultReminderSettings();
  }
}

export async function saveReminderSettings(
  storage: StoragePort,
  userId: string,
  settings: ReminderSettings,
) {
  await storage.setItem(
    reminderStorageKey(userId),
    JSON.stringify(normalizeReminderSettings(settings)),
  );
}
