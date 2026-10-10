import { describe, expect, it } from 'vitest';
import type { CheckInRecord, PatientBootstrap } from '@/features/patient/types';
import { CLEAN_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import {
  CONSENT_VERSION,
  applyConsent,
  consentHistoryOf,
  consentOf,
  isSharedWithTeam,
  stampSharing,
} from '@/features/patient/utils/consent';

const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-05T15:30:00.000Z';
const base: PatientBootstrap = { ...CLEAN_BOOTSTRAP };

const record: CheckInRecord = {
  id: 'r1',
  date: '2026-10-06',
  time: '09:00',
  pain: 3,
  zones: [],
  emergency: false,
  registrant: 'self',
  doses: [],
};

describe('MOB-06 · consentimiento (utils)', () => {
  it('sin registro se asume aceptado y sin fecha inventada', () => {
    expect(consentOf(base)).toEqual({ granted: true, version: CONSENT_VERSION, since: null });
    expect(consentHistoryOf(base)).toEqual([]);
  });

  it('revocar guarda la fecha real y la versión', () => {
    const next = applyConsent(base, 'revocado', T1);
    expect(consentOf(next)).toEqual({ granted: false, version: CONSENT_VERSION, since: T1 });
    expect(next.consentHistory).toEqual([
      { id: 'consent-1', action: 'revocado', version: CONSENT_VERSION, createdAt: T1 },
    ]);
  });

  it('aceptar tras revocar agrega otro evento; el historial va del más reciente al más antiguo', () => {
    const revoked = applyConsent(base, 'revocado', T1);
    const accepted = applyConsent(revoked, 'aceptado', T2, '1.1');
    expect(consentOf(accepted)).toEqual({ granted: true, version: '1.1', since: T2 });
    expect(consentHistoryOf(accepted).map((e) => [e.id, e.action])).toEqual([
      ['consent-2', 'aceptado'],
      ['consent-1', 'revocado'],
    ]);
  });

  it('repetir el mismo estado no duplica eventos', () => {
    const revoked = applyConsent(base, 'revocado', T1);
    expect(applyConsent(revoked, 'revocado', T2)).toBe(revoked);
  });

  it('no muta el bootstrap original', () => {
    applyConsent(base, 'revocado', T1);
    expect(base.consent).toBeUndefined();
  });

  it('con consentimiento revocado el check-in queda marcado como no compartido', () => {
    const revoked = applyConsent(base, 'revocado', T1);
    const stamped = stampSharing(record, revoked);
    expect(stamped.sharedWithTeam).toBe(false);
    expect(isSharedWithTeam(stamped)).toBe(false);
  });

  it('con consentimiento vigente (o sin registro) el check-in se comparte; registros viejos cuentan como compartidos', () => {
    expect(stampSharing(record, base).sharedWithTeam).toBe(true);
    expect(isSharedWithTeam(record)).toBe(true);
  });
});
