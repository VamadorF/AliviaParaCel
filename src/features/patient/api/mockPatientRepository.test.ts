import { describe, expect, it } from 'vitest';
import { CLEAN_RUT, DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';

const demoUser = MOCK_USERS.find((u) => u.rut === DEMO_RUT)!;
const cleanUser = MOCK_USERS.find((u) => u.rut === CLEAN_RUT)!;

function repo() {
  return createMockPatientRepository({
    storage: createMemoryStorage(),
    delayMs: 0,
  });
}

describe('CAL-01 · mockPatientRepository (persistencia)', () => {
  it('usuario limpio sin check-ins al sembrar', async () => {
    const data = await repo().loadBootstrap(cleanUser.id, 'clean');
    expect(data.checkIns).toHaveLength(0);
    expect(data.medications).toHaveLength(0);
  });

  it('demo trae check-ins de fixture', async () => {
    const data = await repo().loadBootstrap(demoUser.id, 'demo');
    expect(data.checkIns.length).toBeGreaterThan(0);
  });

  it('persiste check-in entre cargas', async () => {
    const patient = repo();
    await patient.loadBootstrap(demoUser.id, 'demo');
    const next = await patient.appendCheckIn(demoUser.id, 'demo', {
      id: 'x',
      date: '2026-01-01',
      time: '10:00',
      pain: 3,
      zones: ['Lumbar'],
      emergency: false,
      registrant: 'self',
      doses: [],
    });
    expect(next.checkIns[0].id).toBe('x');

    const reloaded = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(reloaded.checkIns[0].id).toBe('x');
  });

  it('saveBootstrap persiste entre cargas', async () => {
    const patient = repo();
    const base = await patient.loadBootstrap(demoUser.id, 'demo');
    const edited = { ...base, messages: [{ id: 'm-new', from: 'team' as const, body: 'Hola', at: '2026-01-01T10:00:00Z' }] };
    await patient.saveBootstrap(demoUser.id, edited);
    const reloaded = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(reloaded.messages).toHaveLength(1);
    expect(reloaded.messages[0].id).toBe('m-new');
  });

  it('JSON inválido en storage re-siembra desde fixture', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(`@alivia/patient-bootstrap/v1/${demoUser.id}`, '{no-json');
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const data = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(data.checkIns.some((c) => c.id === 'c1')).toBe(true);
  });

  it('MOB-06: revocar persiste entre cargas con fecha real y versión', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const at = '2026-10-05T15:30:00.000Z';
    await patient.setConsent(demoUser.id, 'demo', 'revocado', at);

    // "Recarga": un repositorio nuevo sobre el mismo storage.
    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(demoUser.id, 'demo');
    expect(reloaded.consent).toEqual({ status: 'revocado', version: '1.0', updatedAt: at });
    expect(reloaded.consentHistory).toHaveLength(1);
    expect(reloaded.consentHistory?.[0]).toMatchObject({ action: 'revocado', createdAt: at });
  });

  it('MOB-06: check-in con consentimiento revocado queda local, marcado no compartido', async () => {
    const patient = repo();
    await patient.setConsent(cleanUser.id, 'clean', 'revocado', '2026-10-05T15:30:00.000Z');
    const next = await patient.appendCheckIn(cleanUser.id, 'clean', {
      id: 'solo-local',
      date: '2026-10-06',
      time: '10:00',
      pain: 5,
      zones: [],
      emergency: false,
      registrant: 'self',
      doses: [],
    });
    expect(next.checkIns[0].id).toBe('solo-local');
    expect(next.checkIns[0].sharedWithTeam).toBe(false);

    await patient.setConsent(cleanUser.id, 'clean', 'aceptado', '2026-10-07T08:00:00.000Z');
    const after = await patient.appendCheckIn(cleanUser.id, 'clean', { ...next.checkIns[0], id: 'compartido' });
    expect(after.checkIns[0].sharedWithTeam).toBe(true);
    expect(after.checkIns.find((c) => c.id === 'solo-local')?.sharedWithTeam).toBe(false);
  });

  it('MOB-07: aprobar una solicitud persiste y suma al equipo', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const before = await patient.loadBootstrap(demoUser.id, 'demo');
    const pending = before.linkRequests?.find((request) => request.status === 'Pendiente');
    expect(pending).toBeTruthy();

    const next = await patient.decideLinkRequest(demoUser.id, 'demo', pending!.id, 'Aprobado');
    expect(next.linkRequests?.find((request) => request.id === pending!.id)?.status).toBe('Aprobado');
    expect(next.team?.find((member) => member.id === pending!.requesterRut)).toMatchObject({
      name: pending!.requesterName,
      expiresAt: pending!.expiresAt,
    });

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.linkRequests?.find((request) => request.id === pending!.id)?.status).toBe(
      'Aprobado',
    );
    expect(reloaded.team?.some((member) => member.name === pending!.requesterName)).toBe(true);
    expect(reloaded.checkIns.some((checkIn) => checkIn.id === 'c1')).toBe(true);
  });

  it('MOB-07: eliminar cuenta no borra el bootstrap', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    await patient.appendCheckIn(demoUser.id, 'demo', {
      id: 'no-borrar',
      date: '2026-10-10',
      time: '12:00',
      pain: 3,
      zones: ['Lumbar'],
      emergency: false,
      registrant: 'self',
      doses: [],
    });

    const after = await patient.requestAccountDeletion(demoUser.id, 'demo');
    expect(after.checkIns.some((checkIn) => checkIn.id === 'no-borrar')).toBe(true);

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.checkIns.some((checkIn) => checkIn.id === 'no-borrar')).toBe(true);
    expect(reloaded.checkIns.some((checkIn) => checkIn.id === 'c1')).toBe(true);
    expect(reloaded.medications.some((med) => med.id === 'm1')).toBe(true);
    expect(reloaded.pathology).toBe('Fibromialgia + Depresión');
  });

  it('reset demo vuelve al fixture', async () => {
    const patient = repo();
    await patient.appendCheckIn(demoUser.id, 'demo', {
      id: 'temp',
      date: '2026-01-01',
      time: '09:00',
      pain: 2,
      zones: ['Cuello'],
      emergency: false,
      registrant: 'self',
      doses: [],
    });
    const reset = await patient.resetDemoData(demoUser.id, 'demo');
    expect(reset.checkIns.some((c) => c.id === 'temp')).toBe(false);
    expect(reset.checkIns.some((c) => c.id === 'c1')).toBe(true);
  });
});
