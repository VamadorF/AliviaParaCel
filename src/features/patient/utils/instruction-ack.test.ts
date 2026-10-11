import { describe, expect, it } from 'vitest';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import type { PatientBootstrap } from '@/features/patient/types';
import { CLEAN_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import { DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import { acknowledgeInstruction, instructionReadAt } from '@/features/patient/utils/instruction-ack';

const AT = '2026-10-10T21:20:00.000Z';
const LATER = '2026-10-11T12:00:00.000Z';
const demoUser = MOCK_USERS.find((user) => user.rut === DEMO_RUT)!;

function withInstruction(): PatientBootstrap {
  return {
    ...CLEAN_BOOTSTRAP,
    instruction: {
      id: 3,
      text: 'Beber más agua y registrar síntomas',
      date: '2026-10-08T12:00:00.000Z',
    },
  };
}

describe('PAC-08 · acuse de instrucción', () => {
  it('guarda el acuse en el mock con la fecha real', async () => {
    const base = withInstruction();
    const next = acknowledgeInstruction(base, AT);

    expect(next.instructionAcks).toEqual([{ alertId: 3, readAt: AT }]);
    expect(instructionReadAt(next)).toBe(AT);
    expect(base.instructionAcks).toBeUndefined();

    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const saved = await patient.acknowledgeInstruction(demoUser.id, 'demo', AT);
    expect(saved.instructionAcks).toEqual([{ alertId: 2, readAt: AT }]);

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.instructionAcks).toEqual([{ alertId: 2, readAt: AT }]);
    expect(instructionReadAt(reloaded)).toBe(AT);
  });

  it('si ya estaba acusado no duplica ni cambia la fecha', async () => {
    const first = acknowledgeInstruction(withInstruction(), AT);
    expect(acknowledgeInstruction(first, LATER)).toBe(first);
    expect(first.instructionAcks).toEqual([{ alertId: 3, readAt: AT }]);

    const storage = createMemoryStorage();
    const key = `@alivia/patient-bootstrap/v1/${demoUser.id}`;
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    await patient.acknowledgeInstruction(demoUser.id, 'demo', AT);
    const before = await storage.getItem(key);

    const again = await patient.acknowledgeInstruction(demoUser.id, 'demo', LATER);
    expect(again.instructionAcks).toHaveLength(1);
    expect(again.instructionAcks?.[0].readAt).toBe(AT);
    expect(await storage.getItem(key)).toBe(before);
  });
});
