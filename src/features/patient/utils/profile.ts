import type {
  CareTeamMember,
  LinkRequest,
  Message,
  PatientBootstrap,
} from '@/features/patient/types';
import { communityAuthor } from '@/features/patient/community/forum';
import { applyConsent } from '@/features/patient/utils/consent';
import { painObservationsForExport } from '@/features/patient/utils/fhir-export';
import { activeMedications } from '@/features/patient/utils/medications';

const DAY_MS = 86400000;

/** Un abogado debe confirmar desde cuándo se cuentan los 15 años. */
export const ACCOUNT_RETENTION_NOTE =
  'Un abogado debe confirmar desde cuándo se cuentan los 15 años.';

export const ACCOUNT_DELETED_MARK = 'Cuenta del paciente eliminada';

export const DELETED_POST_TEXT = 'Publicación eliminada';

export const DELETE_ACCOUNT_TITLE = '¿Eliminar tu cuenta?';

export const DELETE_ACCOUNT_INTRO =
  'Se borrarán tu acceso, tu foto, tus datos de contacto, tus preferencias, tu conversación con el Asistente AlivIA y el texto de tus publicaciones en la Comunidad.';

export const DELETE_ACCOUNT_RECORD =
  'Tu ficha clínica (tus registros compartidos, tratamiento, notas y mensajes con tu equipo) ';

export const DELETE_ACCOUNT_RECORD_STRONG = 'no se borra';

export const DELETE_ACCOUNT_RECORD_REST =
  ': la ley obliga a tu centro de salud a conservarla al menos 15 años. Tu equipo podrá seguir consultándola, pero no se agregarán datos nuevos.';

export const DELETE_ACCOUNT_RETURN =
  'Si más adelante te invitan de nuevo con tu RUT, recuperarás el acceso a tu ficha.';

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

function isAssistantMessage(message: Message): boolean {
  if (message.channel === 'team' || message.from === 'team') return false;
  return message.channel === 'assistant' || message.from === 'alivia';
}

/**
 * PAC-15 · Borra acceso local no clínico y deja la ficha en solo lectura.
 * Un abogado debe confirmar desde cuándo se cuentan los 15 años.
 */
export function requestAccountDeletion(
  data: PatientBootstrap,
  input: { authorName: string; at: string; reporterRut?: string },
): PatientBootstrap {
  const author = communityAuthor(input.authorName);
  const reporter = input.reporterRut?.trim();
  const next: PatientBootstrap = {
    ...data,
    photoUri: null,
    email: '',
    phone: '',
    messages: data.messages.filter((message) => !isAssistantMessage(message)),
    posts: data.posts.map((post) =>
      post.author === author ? { ...post, excerpt: DELETED_POST_TEXT } : post,
    ),
    forumReports: data.forumReports?.map((report) =>
      reporter && report.reporterRut === reporter ? { ...report, reporterRut: 'anónimo' } : report,
    ),
    readOnlyReason: ACCOUNT_DELETED_MARK,
  };
  return applyConsent(next, 'revocado', input.at);
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
    fhir: {
      resourceType: 'Bundle',
      type: 'collection',
      entry: painObservationsForExport(data.checkIns).map((resource) => ({ resource })),
    },
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
