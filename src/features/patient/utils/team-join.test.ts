import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import { DEMO_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import { DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import {
  acceptedTeamRows,
  ASK_TO_LEAVE,
  askDoctorToLeave,
  newTeamNotice,
  persistAskDoctorToLeave,
  SOLE_DOCTOR_EXPLANATION,
} from '@/features/patient/utils/team-join';

const NOW = new Date('2026-10-10T15:00:00.000Z');
const INVITED = '20333444-3';
const demoUser = MOCK_USERS.find((user) => user.rut === DEMO_RUT)!;
const SCREEN = join(dirname(fileURLToPath(import.meta.url)), '..', 'screens', 'PatientProfileScreen.tsx');

describe('CLI-08 · equipo mutuo en el perfil', () => {
  it('avisa del médico recién aceptado, con fecha si el vínculo es temporal', () => {
    expect(ASK_TO_LEAVE).toBe('Pedir que deje mi equipo');
    expect(newTeamNotice('Dra. Invitada Soto', '28-07-2026')).toBe(
      'Nuevo en tu equipo: Dra. Invitada Soto · hasta 28-07-2026',
    );
    expect(newTeamNotice('Dra. Invitada Soto', null)).toBe('Nuevo en tu equipo: Dra. Invitada Soto');

    const rows = acceptedTeamRows(DEMO_BOOTSTRAP.team, NOW);
    expect(rows.map((row) => row.name)).toEqual(['Dra. Invitada Soto']);
    expect(rows[0]?.notice.startsWith('Nuevo en tu equipo: Dra. Invitada Soto · hasta ')).toBe(true);
    expect(acceptedTeamRows(
      [{ id: '1', name: 'Dra. Ana', specialty: 'Medicina', newlyAccepted: true }],
      NOW,
    )[0]?.notice).toBe('Nuevo en tu equipo: Dra. Ana');
  });

  it('el retiro queda guardado; si es el único médico, no se saca', async () => {
    expect(SOLE_DOCTOR_EXPLANATION).toBe('Debe quedar al menos un médico vinculado');

    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const removed = await persistAskDoctorToLeave(patient, demoUser.id, 'demo', INVITED, NOW);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.data.team?.some((member) => member.id === INVITED)).toBe(false);
    expect(removed.data.team?.map((member) => member.id)).toEqual(['12345678-5', '13456789-9']);

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.team?.some((member) => member.id === INVITED)).toBe(false);

    const only = {
      ...DEMO_BOOTSTRAP,
      team: [{ id: INVITED, name: 'Dra. Invitada Soto', specialty: 'Neurología', newlyAccepted: true as const }],
    };
    const blocked = askDoctorToLeave(only, INVITED, NOW);
    expect(blocked.ok).toBe(false);
    if (blocked.ok) return;
    expect(blocked.reason).toBe('sole');
    expect(blocked.data).toBe(only);
    expect(blocked.data.team).toHaveLength(1);

    const screen = readFileSync(SCREEN, 'utf8');
    expect(screen).toContain('ASK_TO_LEAVE');
    expect(screen).toContain('SOLE_DOCTOR_EXPLANATION');
    expect(screen).toContain('acceptedTeamRows');
  });
});
