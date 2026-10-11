import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import {
  decideAppointment,
  defaultReminderSettings,
  formatClock,
  isQuietMinute,
  loadReminderSettings,
  medicationChoice,
  parseClock,
  planLocalReminders,
  reminderMedications,
  reminderStorageKey,
  saveReminderSettings,
  type QuietHours,
  type ReminderSettings,
} from '@/features/patient/notifications/reminders';

const DAY_MS = 24 * 60 * 60 * 1000;

function local(y: number, m: number, d: number, h: number, min: number, s = 0) {
  return new Date(y, m - 1, d, h, min, s, 0);
}

function settings(patch: Partial<ReminderSettings> = {}): ReminderSettings {
  const base = defaultReminderSettings();
  return {
    ...base,
    ...patch,
    dailyTime: patch.dailyTime ?? base.dailyTime,
    medications: patch.medications ?? {},
    quiet: patch.quiet ?? base.quiet,
  };
}

function quiet(patch: Partial<QuietHours> = {}): QuietHours {
  return { enabled: true, start: { hour: 22, minute: 0 }, end: { hour: 7, minute: 0 }, ...patch };
}

const meds = [
  { id: 'm1', name: 'Paracetamol', status: 'activo' },
  { id: 'm2', name: 'Gabapentina', status: 'activo' },
  { id: 'm3', name: 'Tramadol', status: 'suspendido' },
];

describe('recordatorios locales (MOB-18)', () => {
  it('acepta la hora que escribe el paciente', () => {
    expect(parseClock('9:00')).toEqual({ hour: 9, minute: 0 });
    expect(parseClock('09:05')).toEqual({ hour: 9, minute: 5 });
    expect(parseClock('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(formatClock({ hour: 9, minute: 5 })).toBe('09:05');
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('12:60')).toBeNull();
    expect(parseClock('9:5')).toBeNull();
    expect(parseClock('')).toBeNull();
  });

  it('el silencio incluye el inicio, excluye el fin y puede cruzar la medianoche', () => {
    const night = quiet();
    expect(isQuietMinute(22 * 60, night)).toBe(true);
    expect(isQuietMinute(22 * 60 - 1, night)).toBe(false);
    expect(isQuietMinute(0, night)).toBe(true);
    expect(isQuietMinute(6 * 60 + 59, night)).toBe(true);
    expect(isQuietMinute(7 * 60, night)).toBe(false);

    const nap = quiet({ start: { hour: 13, minute: 0 }, end: { hour: 15, minute: 0 } });
    expect(isQuietMinute(13 * 60, nap)).toBe(true);
    expect(isQuietMinute(14 * 60 + 59, nap)).toBe(true);
    expect(isQuietMinute(15 * 60, nap)).toBe(false);
    expect(isQuietMinute(12 * 60 + 59, nap)).toBe(false);

    expect(isQuietMinute(23 * 60, quiet({ enabled: false }))).toBe(false);
    expect(isQuietMinute(23 * 60, quiet({ start: { hour: 22, minute: 0 }, end: { hour: 22, minute: 0 } }))).toBe(
      false,
    );
  });

  it('programa el diario a la hora elegida y lo omite si está apagado o en silencio', () => {
    const now = local(2026, 10, 10, 8, 0);
    const on = planLocalReminders({
      settings: settings({ dailyTime: { hour: 9, minute: 30 }, appointmentEnabled: false }),
      medications: [],
      appointment: null,
      now,
    });
    expect(on).toEqual([
      {
        id: 'alivia-daily',
        title: 'Registro de hoy',
        body: 'Es la hora que elegiste para anotar cómo estás.',
        url: 'alivia://checkin',
        trigger: { type: 'daily', hour: 9, minute: 30 },
      },
    ]);

    const off = planLocalReminders({
      settings: settings({ dailyEnabled: false, appointmentEnabled: false }),
      medications: [],
      appointment: null,
      now,
    });
    expect(off).toEqual([]);

    const silenced = planLocalReminders({
      settings: settings({
        dailyTime: { hour: 23, minute: 0 },
        appointmentEnabled: false,
        quiet: quiet(),
      }),
      medications: [],
      appointment: null,
      now,
    });
    expect(silenced).toEqual([]);

    const nightAllowed = planLocalReminders({
      settings: settings({
        dailyTime: { hour: 23, minute: 0 },
        appointmentEnabled: false,
        quiet: quiet({ enabled: false }),
      }),
      medications: [],
      appointment: null,
      now,
    });
    expect(nightAllowed.map((item) => item.trigger)).toEqual([{ type: 'daily', hour: 23, minute: 0 }]);
  });

  it('los medicamentos son opcionales, solo los activos, y respetan el silencio', () => {
    const now = local(2026, 10, 10, 8, 0);
    expect(medicationChoice(settings(), 'm1')).toEqual({ enabled: false, time: { hour: 8, minute: 0 } });

    const named = reminderMedications([
      { id: 'm1', name: 'Paracetamol', concentration: '500 mg', status: 'activo' },
    ]);
    expect(named[0]?.name).toBe('Paracetamol 500 mg');

    const plan = planLocalReminders({
      settings: settings({
        dailyEnabled: false,
        appointmentEnabled: false,
        medications: {
          m1: { enabled: true, time: { hour: 8, minute: 15 } },
          m2: { enabled: false, time: { hour: 21, minute: 0 } },
          m3: { enabled: true, time: { hour: 10, minute: 0 } },
          'm-extra': { enabled: true, time: { hour: 9, minute: 0 } },
        },
      }),
      medications: [...meds, { id: 'm-extra', name: '  ', status: 'activo' }],
      appointment: null,
      now,
    });

    expect(plan.map((item) => item.id)).toEqual(['alivia-med-m1', 'alivia-med-m-extra']);
    expect(plan[0]).toMatchObject({
      body: 'Recordatorio: Paracetamol.',
      trigger: { type: 'daily', hour: 8, minute: 15 },
    });
    expect(plan[1]?.body).toBe('Recordatorio: tu medicamento.');

    const quietMed = planLocalReminders({
      settings: settings({
        dailyEnabled: false,
        appointmentEnabled: false,
        medications: { m1: { enabled: true, time: { hour: 23, minute: 30 } } },
        quiet: quiet(),
      }),
      medications: meds,
      appointment: null,
      now,
    });
    expect(quietMed).toEqual([]);
  });

  it('avisa 24 h antes de la consulta, salvo si esa hora cae en silencio', () => {
    const visit = local(2026, 10, 12, 15, 30, 45);
    const now = local(2026, 10, 10, 9, 0);
    const appointment = {
      id: 'a1',
      scheduledAt: visit.toISOString(),
      doctorName: 'Dr. Jesús Fernández',
      reason: 'Control mensual',
    };
    const plan = planLocalReminders({
      settings: settings({ dailyEnabled: false, quiet: quiet({ enabled: false }) }),
      medications: [],
      appointment,
      now,
    });
    expect(plan).toHaveLength(1);
    const trigger = plan[0]?.trigger;
    expect(trigger?.type).toBe('date');
    if (trigger?.type !== 'date') return;
    expect(visit.getTime() - new Date(trigger.at).getTime()).toBe(DAY_MS);
    expect(plan[0]?.body).toBe('Mañana tienes consulta con Dr. Jesús Fernández: Control mensual.');
    expect(plan[0]?.id).toBe('alivia-appt-a1');

    const silenced = decideAppointment(
      true,
      { ...appointment, scheduledAt: local(2026, 10, 12, 6, 30).toISOString() },
      quiet(),
      local(2026, 10, 10, 12, 0),
    );
    expect(silenced.status).toBe('silenced');
    expect(
      planLocalReminders({
        settings: settings({ dailyEnabled: false, quiet: quiet() }),
        medications: [],
        appointment: { ...appointment, scheduledAt: local(2026, 10, 12, 6, 30).toISOString() },
        now: local(2026, 10, 10, 12, 0),
      }),
    ).toEqual([]);
  });

  it('no avisa la consulta si está apagada o el momento ya pasó', () => {
    const appointment = {
      id: 'a1',
      scheduledAt: local(2026, 10, 12, 10, 0).toISOString(),
      doctorName: 'Dra. Soto',
    };
    const now = local(2026, 10, 10, 9, 0);
    const base = { medications: [], now, settings: settings({ dailyEnabled: false }) };

    expect(
      planLocalReminders({ ...base, settings: settings({ dailyEnabled: false, appointmentEnabled: false }), appointment }),
    ).toEqual([]);
    expect(decideAppointment(false, appointment, quiet(), now).status).toBe('off');
    expect(decideAppointment(true, null, quiet(), now).status).toBe('missing');
    expect(decideAppointment(true, { ...appointment, scheduledAt: 'no-es-fecha' }, quiet(), now).status).toBe(
      'invalid',
    );

    const tooLate = decideAppointment(
      true,
      { ...appointment, scheduledAt: local(2026, 10, 12, 6, 30).toISOString() },
      quiet(),
      local(2026, 10, 11, 8, 0),
    );
    expect(tooLate.status).toBe('passed');

    expect(
      planLocalReminders({
        settings: settings({
          dailyEnabled: false,
          appointmentEnabled: false,
          medications: { m1: { enabled: false, time: { hour: 8, minute: 0 } } },
          quiet: quiet({ enabled: false }),
        }),
        medications: meds,
        appointment,
        now,
      }),
    ).toEqual([]);
  });

  it('guarda la configuración por paciente y descarta JSON roto', async () => {
    const storage = createMemoryStorage();
    const chosen = settings({
      dailyEnabled: false,
      dailyTime: { hour: 18, minute: 45 },
      appointmentEnabled: false,
      quiet: quiet({ enabled: false, start: { hour: 1, minute: 0 }, end: { hour: 2, minute: 0 } }),
      medications: { m1: { enabled: true, time: { hour: 20, minute: 0 } } },
    });
    await saveReminderSettings(storage, 'constanza', chosen);
    await saveReminderSettings(storage, 'nuevo', settings({ dailyEnabled: true }));

    expect(reminderStorageKey('constanza')).not.toBe(reminderStorageKey('nuevo'));
    const loaded = await loadReminderSettings(storage, 'constanza');
    expect(loaded.dailyEnabled).toBe(false);
    expect(loaded.dailyTime).toEqual({ hour: 18, minute: 45 });
    expect(loaded.appointmentEnabled).toBe(false);
    expect(loaded.quiet.enabled).toBe(false);
    expect(loaded.medications.m1).toEqual({ enabled: true, time: { hour: 20, minute: 0 } });
    expect((await loadReminderSettings(storage, 'nuevo')).dailyEnabled).toBe(true);

    await storage.setItem(reminderStorageKey('roto'), '{');
    expect((await loadReminderSettings(storage, 'roto')).dailyTime).toEqual({ hour: 9, minute: 0 });

    await storage.setItem(
      reminderStorageKey('parcial'),
      JSON.stringify({ medications: { m1: { enabled: true, time: { hour: 99, minute: 0 } }, m2: 'no' } }),
    );
    const partial = await loadReminderSettings(storage, 'parcial');
    expect(partial.dailyEnabled).toBe(true);
    expect(partial.appointmentEnabled).toBe(true);
    expect(partial.quiet.enabled).toBe(true);
    expect(partial.medications.m1).toEqual({ enabled: true, time: { hour: 8, minute: 0 } });
    expect(partial.medications.m2).toBeUndefined();
  });
});
