import type {
  CareTeamMember,
  LinkRequest,
  PatientBootstrap,
} from '@/features/patient/types';
import { activeMedications } from '@/features/patient/utils/medications';

const DAY_MS = 86400000;

/** PAC-15 está bloqueada: la Ley 20.584 no define aún qué se borra. */
export const ACCOUNT_DELETION_MESSAGE =
  'La eliminación está pendiente de definición legal (Ley 20.584). Tus datos no se borran.';

function formatAccessDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Texto de vencimiento. Null si el vínculo es permanente o la fecha no viene. */
export function teamExpiryText(
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (expiresAt == null || expiresAt === '') return null;
  const exp = new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) return null;
  const until = formatAccessDate(expiresAt);
  if (exp.getTime() <= now.getTime()) return `Acceso vencido el ${until}`;
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / DAY_MS);
  const unit = daysLeft === 1 ? 'día' : 'días';
  return `Vence el ${until} · quedan ${daysLeft} ${unit}`;
}

export function teamMemberLine(member: CareTeamMember, now: Date = new Date()): string {
  const base = [member.name, member.specialty].filter(Boolean).join(' · ');
  const expiry = teamExpiryText(member.expiresAt, now);
  return expiry ? `${base} · ${expiry}` : base;
}

/** Nombres del equipo para las otras pantallas. Null si el fixture no trae equipo. */
export function teamHeadline(team: CareTeamMember[] | undefined, now: Date = new Date()): string | null {
  if (!team?.length) return null;
  return team
    .map((member) => {
      const expiry = teamExpiryText(member.expiresAt, now);
      return expiry ? `${member.name} · ${expiry}` : member.name;
    })
    .join(', ');
}

function linkIsActive(expiresAt: string | null | undefined, now: Date): boolean {
  if (expiresAt == null || expiresAt === '') return true;
  const exp = new Date(expiresAt).getTime();
  return !Number.isNaN(exp) && exp > now.getTime();
}

export function decideLinkRequest(
  data: PatientBootstrap,
  requestId: string,
  status: 'Aprobado' | 'Rechazado',
  now: Date = new Date(),
): PatientBootstrap {
  const requests = data.linkRequests ?? [];
  const request = requests.find((item) => item.id === requestId);
  if (!request || request.status !== 'Pendiente') return data;

  const linkRequests = requests.map((item) =>
    item.id === requestId ? { ...item, status } : item,
  );
  if (status === 'Rechazado') return { ...data, linkRequests };

  const team = (data.team ?? []).map((member) => ({ ...member }));
  if (!team.some((member) => member.id === request.requesterRut)) {
    const member: CareTeamMember = {
      id: request.requesterRut,
      name: request.requesterName,
      specialty: request.specialty ?? (request.requesterRole === 'organizacion' ? 'Organización' : 'Médico'),
    };
    if (request.expiresAt) member.expiresAt = request.expiresAt;
    team.push(member);
  }

  return {
    ...data,
    linkRequests,
    team,
    doctorLinked: data.doctorLinked || team.some((member) => linkIsActive(member.expiresAt, now)),
  };
}

export function applyContact(
  data: PatientBootstrap,
  email: string,
  phone: string,
): { ok: true; next: PatientBootstrap } | { ok: false; error: string } {
  const nextEmail = email.trim();
  const nextPhone = phone.trim();
  if (!nextEmail.includes('@')) return { ok: false, error: 'Ingresa un correo válido' };
  if (nextEmail === (data.email ?? '') && nextPhone === (data.phone ?? '')) {
    return { ok: true, next: data };
  }
  return { ok: true, next: { ...data, email: nextEmail, phone: nextPhone } };
}

export function applyPhoto(data: PatientBootstrap, photoUri: string | null): PatientBootstrap {
  if ((data.photoUri ?? null) === photoUri) return data;
  return { ...data, photoUri };
}

/** No borra nada. PAC-15 sigue bloqueada. */
export function requestAccountDeletion(data: PatientBootstrap): PatientBootstrap {
  return data;
}

/** JSON local con lo que ya tiene el mock. No llama a un servidor FHIR. */
export function buildRecordFile(input: {
  name: string;
  rut: string;
  data: PatientBootstrap;
}): string {
  const { name, rut, data } = input;
  const payload = {
    nombre: name,
    rut,
    patologia: data.pathology ?? null,
    correo: data.email ?? '',
    telefono: data.phone ?? '',
    foto: data.photoUri ?? null,
    equipo: (data.team ?? []).map((member) => ({
      nombre: member.name,
      especialidad: member.specialty,
      ...(member.expiresAt ? { vence: member.expiresAt } : {}),
    })),
    tratamientoActivo: activeMedications(data.medications).map((med) => ({
      nombre: med.name,
      concentracion: med.concentration,
      forma: med.form,
      cantidad: med.quantity,
      via: med.route,
      frecuencia: med.frequency,
      duracion: med.duration,
    })),
    registros: data.checkIns,
    consentimiento: data.consent ?? null,
    cita: data.appointment,
    clinica: data.clinic ?? null,
    solicitudes: (data.linkRequests ?? []).map((request: LinkRequest) => ({
      id: request.id,
      solicitante: request.requesterName,
      estado: request.status,
    })),
  };
  return JSON.stringify(payload, null, 2);
}
