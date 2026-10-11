import { describe, expect, it } from 'vitest';
import { DEMO_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import {
  ACCOUNT_DELETED_MARK,
  ACCOUNT_RETENTION_NOTE,
  applyContact,
  buildRecordFile,
  DELETE_ACCOUNT_INTRO,
  DELETE_ACCOUNT_RECORD,
  DELETE_ACCOUNT_RECORD_REST,
  DELETE_ACCOUNT_RECORD_STRONG,
  DELETE_ACCOUNT_RETURN,
  DELETE_ACCOUNT_TITLE,
  DELETED_POST_TEXT,
  decideLinkRequest,
  requestAccountDeletion,
  teamExpiryText,
  teamMemberLine,
} from '@/features/patient/utils/profile';

const DAY_BEFORE = 86400000;

describe('MOB-07 · perfil', () => {
  it('aprobar suma al equipo y conserva el vencimiento del fixture', () => {
    const pending = DEMO_BOOTSTRAP.linkRequests?.find((request) => request.status === 'Pendiente');
    expect(pending?.expiresAt).toBeTruthy();
    const next = decideLinkRequest(DEMO_BOOTSTRAP, pending!.id, 'Aprobado');
    const member = next.team?.find((item) => item.id === pending!.requesterRut);
    expect(next.linkRequests?.find((request) => request.id === pending!.id)?.status).toBe('Aprobado');
    expect(member).toMatchObject({
      name: pending!.requesterName,
      expiresAt: pending!.expiresAt,
    });
    expect(next.checkIns).toHaveLength(DEMO_BOOTSTRAP.checkIns.length);
  });

  it('rechazar no agrega al equipo', () => {
    const pending = DEMO_BOOTSTRAP.linkRequests![0];
    const next = decideLinkRequest(DEMO_BOOTSTRAP, pending.id, 'Rechazado');
    expect(next.team?.some((member) => member.id === pending.requesterRut)).toBe(false);
    expect(next.linkRequests?.find((request) => request.id === pending.id)?.status).toBe('Rechazado');
  });

  it('una solicitud ya decidida no se vuelve a aplicar', () => {
    const once = decideLinkRequest(DEMO_BOOTSTRAP, 'req-javier', 'Aprobado');
    const twice = decideLinkRequest(once, 'req-javier', 'Aprobado');
    expect(twice).toBe(once);
  });

  it('el vencimiento solo aparece si el vínculo lo trae', () => {
    const now = new Date('2026-10-10T15:00:00.000Z');
    const permanent = DEMO_BOOTSTRAP.team![0];
    expect(teamExpiryText(permanent.expiresAt, now)).toBeNull();
    expect(teamMemberLine(permanent, now)).toBe(
      'Dr. Jesús Fernández · Especialista en Dolor Crónico',
    );
    const soon = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
    expect(teamExpiryText(soon, now)).toMatch(/^Vence el .+ · quedan 1 día$/);
    const past = new Date(now.getTime() - DAY_BEFORE).toISOString();
    expect(teamExpiryText(past, now)).toMatch(/^Acceso vencido el /);
  });

  it('un correo sin @ no cambia el contacto', () => {
    const result = applyContact(DEMO_BOOTSTRAP, 'sin-arroba', '+56911111111');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Ingresa un correo válido');
  });

  it('eliminar cuenta borra el chat del asistente y conserva la ficha', () => {
    const next = requestAccountDeletion(
      {
        ...DEMO_BOOTSTRAP,
        photoUri: 'file://foto',
        phone: '+56911111111',
        messages: [
          ...DEMO_BOOTSTRAP.messages,
          {
            id: 'asst',
            from: 'patient',
            channel: 'assistant',
            body: 'me duele',
            at: '2026-10-10T10:00:00.000Z',
          },
          {
            id: 'equipo',
            from: 'patient',
            channel: 'team',
            body: 'consulta',
            at: '2026-10-10T11:00:00.000Z',
          },
        ],
        forumReports: [
          {
            id: 'r1',
            postId: 'p1',
            reporterRut: '9876543-3',
            reason: 'spam',
            status: 'abierto',
            createdAt: '2026-10-01T00:00:00.000Z',
          },
        ],
      },
      { authorName: 'Constanza Elizondo', reporterRut: '9876543-3', at: '2026-10-10T12:00:00.000Z' },
    );
    expect(next.checkIns.map((item) => item.id)).toEqual(DEMO_BOOTSTRAP.checkIns.map((item) => item.id));
    expect(next.medications.map((item) => item.id)).toEqual(DEMO_BOOTSTRAP.medications.map((item) => item.id));
    expect(next.pathology).toBe(DEMO_BOOTSTRAP.pathology);
    expect(next.messages.map((item) => item.id)).toEqual(['msg2', 'equipo']);
    expect(next.posts.find((post) => post.id === 'p3')?.excerpt).toBe(DELETED_POST_TEXT);
    expect(next.posts.find((post) => post.id === 'p1')?.excerpt).toContain('compresas');
    expect(next.photoUri).toBeNull();
    expect(next.email).toBe('');
    expect(next.phone).toBe('');
    expect(next.consent).toMatchObject({ status: 'revocado', updatedAt: '2026-10-10T12:00:00.000Z' });
    expect(next.readOnlyReason).toBe(ACCOUNT_DELETED_MARK);
    expect(next.forumReports?.[0].reporterRut).toBe('anónimo');
    expect(DELETE_ACCOUNT_TITLE).toBe('¿Eliminar tu cuenta?');
    expect(DELETE_ACCOUNT_INTRO).toBe(
      'Se borrarán tu acceso, tu foto, tus datos de contacto, tus preferencias, tu conversación con el Asistente AlivIA y el texto de tus publicaciones en la Comunidad.',
    );
    expect(`${DELETE_ACCOUNT_RECORD}${DELETE_ACCOUNT_RECORD_STRONG}${DELETE_ACCOUNT_RECORD_REST}`).toBe(
      'Tu ficha clínica (tus registros compartidos, tratamiento, notas y mensajes con tu equipo) no se borra: la ley obliga a tu centro de salud a conservarla al menos 15 años. Tu equipo podrá seguir consultándola, pero no se agregarán datos nuevos.',
    );
    expect(DELETE_ACCOUNT_RETURN).toBe(
      'Si más adelante te invitan de nuevo con tu RUT, recuperarás el acceso a tu ficha.',
    );
    expect(ACCOUNT_RETENTION_NOTE).toBe(
      'Un abogado debe confirmar desde cuándo se cuentan los 15 años.',
    );
  });

  it('la ficha local incluye el tratamiento activo y omite el suspendido', () => {
    const file = JSON.parse(
      buildRecordFile({ name: 'Constanza Elizondo', rut: '9876543-3', data: DEMO_BOOTSTRAP }),
    ) as { tratamientoActivo: { nombre: string }[]; patologia: string };
    expect(file.patologia).toBe('Fibromialgia + Depresión');
    expect(file.tratamientoActivo.map((med) => med.nombre)).toEqual(['Paracetamol', 'Gabapentina']);
  });
});
