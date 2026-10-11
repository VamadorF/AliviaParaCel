import type { CareTeamMember, Message, PatientBootstrap } from '@/features/patient/types';

/** PAC-12 · Médicos del equipo con mensajería habilitada. */
export function messagingTeamDoctors(data: PatientBootstrap): CareTeamMember[] {
  const team = data.team ?? [];
  const flagged = team.some((member) => member.messagingEnabled !== undefined);
  if (flagged) return team.filter((member) => member.messagingEnabled === true);
  if (data.doctorLinked && data.messagingEnabled && team.length > 0) return [team[0]];
  return [];
}

export function resolveTeamMessagingDoctor(data: PatientBootstrap): CareTeamMember | null {
  const options = messagingTeamDoctors(data);
  if (options.length === 0) return null;
  const picked = data.teamMessagingDoctorId;
  if (picked) {
    const found = options.find((member) => member.id === picked);
    if (found) return found;
  }
  return options[0];
}

export function teamChannelOpen(data: PatientBootstrap): boolean {
  return resolveTeamMessagingDoctor(data) !== null;
}

export function applyTeamMessagingDoctor(data: PatientBootstrap, doctorId: string): PatientBootstrap {
  const options = messagingTeamDoctors(data);
  if (!options.some((member) => member.id === doctorId)) return data;
  return { ...data, teamMessagingDoctorId: doctorId };
}

/** Mensajes del canal equipo visibles para el médico elegido (legacy sin doctorId = todos). */
export function teamMessagesForDoctor(messages: Message[], doctorId: string | null): Message[] {
  return messages.filter(
    (message) =>
      message.channel !== 'team' ||
      !message.teamDoctorId ||
      !doctorId ||
      message.teamDoctorId === doctorId,
  );
}
