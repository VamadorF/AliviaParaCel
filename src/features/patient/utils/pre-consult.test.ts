import { describe, expect, it } from 'vitest';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import type { Appointment, PatientBootstrap } from '@/features/patient/types';
import { CLEAN_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import { CLEAN_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import {
  preConsultOf,
  preConsultOpen,
  preConsultParts,
  preConsultSlot,
  submitPreConsult,
} from '@/features/patient/utils/pre-consult';

const HOUR = 60 * 60 * 1000;
const TOPICS = 'El dolor de cabeza al leer';
const GOAL = 'Leer 20 minutos sin parar';
const cleanUser = MOCK_USERS.find((user) => user.rut === CLEAN_RUT)!;

function visit(scheduledAt: string): Appointment {
  return {
    id: 'a1',
    scheduledAt,
    doctorName: 'Dr. Jesús Fernández',
    reason: 'Control',
    status: 'Pendiente',
  };
}

function withVisit(scheduledAt: string): PatientBootstrap {
  return { ...CLEAN_BOOTSTRAP, appointment: visit(scheduledAt) };
}

describe('PAC-10 · preparación de la consulta', () => {
  it('dentro de 48 h se puede responder', async () => {
    const now = Date.parse('2026-10-10T15:00:00.000Z');
    const at = new Date(now).toISOString();
    const soon = new Date(now + 2 * HOUR).toISOString();
    const edge = new Date(now + 48 * HOUR).toISOString();

    expect(preConsultOpen(soon, now)).toBe(true);
    expect(preConsultOpen(edge, now)).toBe(true);
    expect(preConsultSlot(visit(soon), now)).toBe('form');
    expect(preConsultSlot(visit(edge), now)).toBe('form');

    const base = withVisit(soon);
    const next = submitPreConsult(base, { topics: TOPICS, pgic: 2, functionalGoal: GOAL }, at);

    expect(base.appointment?.preConsult).toBeUndefined();
    expect(next.appointment?.preConsult).toEqual({
      appointmentId: 'a1',
      topics: TOPICS,
      pgic: 2,
      functionalGoal: GOAL,
      answeredAt: at,
    });
    expect(preConsultSlot(next.appointment, now)).toBe('answers');
    expect(preConsultParts(next.appointment!.preConsult!)).toEqual([
      { label: 'Qué tratar', value: TOPICS },
      { label: 'Cambio', value: 'Mucho mejor' },
      { label: 'Objetivo', value: GOAL },
    ]);
    expect(next.checkIns).toBe(base.checkIns);

    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    await patient.saveBootstrap(cleanUser.id, base);
    const saved = await patient.submitPreConsult(
      cleanUser.id,
      'clean',
      { topics: TOPICS, pgic: 2, functionalGoal: GOAL },
      at,
    );
    expect(saved.appointment?.preConsult).toEqual(next.appointment?.preConsult);

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      cleanUser.id,
      'clean',
    );
    expect(reloaded.appointment?.preConsult).toEqual(saved.appointment?.preConsult);
    expect(preConsultOf(reloaded.appointment)?.topics).toBe(TOPICS);
  });

  it('fuera de 48 h no se muestra el formulario', async () => {
    const now = Date.parse('2026-10-10T15:00:00.000Z');
    const at = new Date(now).toISOString();
    const later = new Date(now + 49 * HOUR).toISOString();
    const past = new Date(now - HOUR).toISOString();

    expect(preConsultOpen(later, now)).toBe(false);
    expect(preConsultOpen(past, now)).toBe(false);
    expect(preConsultSlot(visit(later), now)).toBe('none');
    expect(preConsultSlot(visit(past), now)).toBe('none');
    expect(preConsultSlot(null, now)).toBe('none');

    const far = withVisit(later);
    expect(submitPreConsult(far, { topics: TOPICS, pgic: 4, functionalGoal: GOAL }, at)).toBe(far);
    expect(far.appointment?.preConsult ?? null).toBeFalsy();

    const started = withVisit(past);
    expect(submitPreConsult(started, { topics: TOPICS, pgic: 4, functionalGoal: GOAL }, at)).toBe(
      started,
    );

    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    await patient.saveBootstrap(cleanUser.id, far);
    const refused = await patient.submitPreConsult(
      cleanUser.id,
      'clean',
      { topics: TOPICS, pgic: 4, functionalGoal: GOAL },
      at,
    );
    expect(refused.appointment?.preConsult ?? null).toBeFalsy();
    expect(preConsultSlot(refused.appointment, now)).toBe('none');

    const checked = await patient.appendCheckIn(cleanUser.id, 'clean', {
      id: 'x',
      date: '2026-10-10',
      time: '15:10',
      pain: 3,
      zones: ['Lumbar'],
      emergency: false,
      registrant: 'self',
      doses: [],
    });
    expect(checked.checkIns[0]?.id).toBe('x');
    expect(checked.appointment?.status).toBe('Pendiente');
    expect(checked.appointment?.preConsult ?? null).toBeFalsy();
  });

  it('una segunda respuesta a la misma consulta no duplica', async () => {
    const now = Date.parse('2026-10-10T15:00:00.000Z');
    const at = new Date(now).toISOString();
    const later = new Date(now + 30 * 60 * 1000).toISOString();
    const soon = new Date(now + 2 * HOUR).toISOString();
    const base = withVisit(soon);

    const first = submitPreConsult(base, { topics: TOPICS, pgic: 2, functionalGoal: GOAL }, at);
    const again = submitPreConsult(
      first,
      { topics: 'Otra cosa', pgic: 7, functionalGoal: 'Otra meta' },
      later,
    );

    expect(again).toBe(first);
    expect(again.appointment?.preConsult).toEqual({
      appointmentId: 'a1',
      topics: TOPICS,
      pgic: 2,
      functionalGoal: GOAL,
      answeredAt: at,
    });
    expect(preConsultSlot(again.appointment, now + 30 * 60 * 1000)).toBe('answers');

    const storage = createMemoryStorage();
    const key = `@alivia/patient-bootstrap/v1/${cleanUser.id}`;
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    await patient.saveBootstrap(cleanUser.id, base);
    await patient.submitPreConsult(
      cleanUser.id,
      'clean',
      { topics: TOPICS, pgic: 2, functionalGoal: GOAL },
      at,
    );
    const before = await storage.getItem(key);

    const savedAgain = await patient.submitPreConsult(
      cleanUser.id,
      'clean',
      { topics: 'Otra cosa', pgic: 7, functionalGoal: 'Otra meta' },
      later,
    );
    expect(savedAgain.appointment?.preConsult).toEqual(first.appointment?.preConsult);
    expect(await storage.getItem(key)).toBe(before);
  });
});
