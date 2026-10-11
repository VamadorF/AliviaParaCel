import type { PatientRepository } from '@/features/patient/api/patientRepository';
import type { Message, PatientBootstrap } from '@/features/patient/types';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';

export type TeamMessageInput = {
  id: string;
  body: string;
  at: string;
  /** PAC-12 · Médico del equipo destinatario. */
  teamDoctorId?: string;
};

export type TeamMessageWrite =
  | { ok: true; data: PatientBootstrap }
  | { ok: false; reason: 'empty' };

export function newTeamMessageId(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (randomUUID) return randomUUID();
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Añade un mensaje del paciente al canal del equipo. Vacío (o solo espacios) no se guarda. */
export function appendTeamMessage(
  data: PatientBootstrap,
  input: TeamMessageInput,
): TeamMessageWrite {
  const body = input.body.trim();
  if (!body) return { ok: false, reason: 'empty' };
  if (data.messages.some((message) => message.id === input.id)) {
    return { ok: true, data };
  }
  const message: Message = {
    id: input.id,
    from: 'patient',
    body,
    at: input.at,
    channel: 'team',
    ...(input.teamDoctorId ? { teamDoctorId: input.teamDoctorId } : {}),
  };
  return { ok: true, data: { ...data, messages: [...data.messages, message] } };
}

export async function persistTeamMessage(
  repository: Pick<PatientRepository, 'loadBootstrap' | 'saveBootstrap'>,
  userId: string,
  profile: PatientProfileKind,
  input: TeamMessageInput,
): Promise<TeamMessageWrite> {
  const current = await repository.loadBootstrap(userId, profile);
  const next = appendTeamMessage(current, input);
  if (!next.ok || next.data === current) return next;
  const saved = await repository.saveBootstrap(userId, next.data);
  return { ok: true, data: saved };
}
