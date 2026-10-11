/**
 * CLI-08 · Equipo mutuo, lado paciente (D-03).
 * El panel del médico no vive aquí: el mock ya trae al médico que aceptó.
 */
import type { PatientRepository } from '@/features/patient/api/patientRepository';
import type { CareTeamMember, PatientBootstrap } from '@/features/patient/types';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';

export const ASK_TO_LEAVE = 'Pedir que deje mi equipo';

export const SOLE_DOCTOR_EXPLANATION = 'Debe quedar al menos un médico vinculado';

export function newTeamNotice(name: string, untilLabel: string | null): string {
  return untilLabel ? `Nuevo en tu equipo: ${name} · hasta ${untilLabel}` : `Nuevo en tu equipo: ${name}`;
}

export function teamUntilLabel(expiresAt: string | null | undefined): string | null {
  if (expiresAt == null || expiresAt === '') return null;
  const exp = new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) return null;
  return exp.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isActive(member: CareTeamMember, now: Date): boolean {
  if (member.expiresAt == null || member.expiresAt === '') return true;
  const exp = new Date(member.expiresAt).getTime();
  return !Number.isNaN(exp) && exp > now.getTime();
}

export type AcceptedTeamRow = {
  id: string;
  name: string;
  notice: string;
};

/** Médicos que el mock marca como recién aceptados y cuyo vínculo sigue vigente. */
export function acceptedTeamRows(
  team: CareTeamMember[] | undefined,
  now: Date = new Date(),
): AcceptedTeamRow[] {
  return (team ?? []).flatMap((member) => {
    if (member.newlyAccepted !== true || !isActive(member, now)) return [];
    return [
      {
        id: member.id,
        name: member.name,
        notice: newTeamNotice(member.name, teamUntilLabel(member.expiresAt)),
      },
    ];
  });
}

export type LeaveTeamResult =
  | { ok: true; data: PatientBootstrap }
  | { ok: false; reason: 'sole' | 'missing' | 'readonly'; data: PatientBootstrap };

/**
 * Quita al médico de inmediato. Si es el único vigente, el equipo no cambia.
 */
export function askDoctorToLeave(
  data: PatientBootstrap,
  doctorId: string,
  now: Date = new Date(),
): LeaveTeamResult {
  if (data.readOnlyReason) return { ok: false, reason: 'readonly', data };
  const team = data.team ?? [];
  const member = team.find((item) => item.id === doctorId);
  if (!member) return { ok: false, reason: 'missing', data };
  const active = team.filter((item) => isActive(item, now));
  if (active.length <= 1 && isActive(member, now)) {
    return { ok: false, reason: 'sole', data };
  }
  const nextTeam = team.filter((item) => item.id !== doctorId);
  return {
    ok: true,
    data: {
      ...data,
      team: nextTeam,
      doctorLinked: nextTeam.some((item) => isActive(item, now)),
    },
  };
}

export async function persistAskDoctorToLeave(
  repository: Pick<PatientRepository, 'loadBootstrap' | 'saveBootstrap'>,
  userId: string,
  profile: PatientProfileKind,
  doctorId: string,
  now: Date = new Date(),
): Promise<LeaveTeamResult> {
  const current = await repository.loadBootstrap(userId, profile);
  const next = askDoctorToLeave(current, doctorId, now);
  if (!next.ok) return next;
  const saved = await repository.saveBootstrap(userId, next.data);
  return { ok: true, data: saved };
}
