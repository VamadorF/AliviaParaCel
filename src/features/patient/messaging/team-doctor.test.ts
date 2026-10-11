import { describe, expect, it } from 'vitest';
import {
  applyTeamMessagingDoctor,
  messagingTeamDoctors,
  resolveTeamMessagingDoctor,
  teamChannelOpen,
  teamMessagesForDoctor,
} from '@/features/patient/messaging/team-doctor';
import type { Message, PatientBootstrap } from '@/features/patient/types';

describe('PAC-12 · selector médico mensajería', () => {
  const base: PatientBootstrap = {
    medications: [],
    checkIns: [],
    appointment: null,
    instruction: null,
    messages: [],
    posts: [],
    messagingEnabled: true,
    doctorLinked: true,
    team: [
      { id: 'd1', name: 'Dr. Uno', specialty: 'Dolor', messagingEnabled: true },
      { id: 'd2', name: 'Dr. Dos', specialty: 'Reuma', messagingEnabled: false },
      { id: 'd3', name: 'Dr. Tres', specialty: 'Neuro', messagingEnabled: true },
    ],
  };

  it('lista solo médicos con mensajería habilitada', () => {
    expect(messagingTeamDoctors(base).map((m) => m.id)).toEqual(['d1', 'd3']);
  });

  it('persiste médico seleccionado y abre canal', () => {
    const picked = applyTeamMessagingDoctor(base, 'd3');
    expect(picked.teamMessagingDoctorId).toBe('d3');
    expect(resolveTeamMessagingDoctor(picked)?.id).toBe('d3');
    expect(teamChannelOpen(picked)).toBe(true);
  });

  it('filtra mensajes por médico destinatario', () => {
    const messages: Message[] = [
      { id: '1', from: 'patient', body: 'a', at: '2026-01-01T10:00:00.000Z', channel: 'team', teamDoctorId: 'd1' },
      { id: '2', from: 'patient', body: 'b', at: '2026-01-01T11:00:00.000Z', channel: 'team', teamDoctorId: 'd3' },
      { id: '3', from: 'team', body: 'c', at: '2026-01-01T12:00:00.000Z', channel: 'team' },
    ];
    expect(teamMessagesForDoctor(messages, 'd3').map((m) => m.id)).toEqual(['2', '3']);
  });
});
