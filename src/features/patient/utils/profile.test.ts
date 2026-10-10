import { describe, expect, it } from 'vitest';

const DAY_BEFORE = 86400000;
import { DEMO_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import {
  ACCOUNT_DELETION_MESSAGE,
  applyContact,
  buildRecordFile,
  decideLinkRequest,
  requestAccountDeletion,
  teamExpiryText,
  teamMemberLine,
} from '@/features/patient/utils/profile';

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

  it('eliminar cuenta devuelve el mismo bootstrap', () => {
    expect(requestAccountDeletion(DEMO_BOOTSTRAP)).toBe(DEMO_BOOTSTRAP);
    expect(ACCOUNT_DELETION_MESSAGE).toContain('pendiente de definición legal');
    expect(ACCOUNT_DELETION_MESSAGE).toContain('no se borran');
  });

  it('la ficha local incluye el tratamiento activo y omite el suspendido', () => {
    const file = JSON.parse(
      buildRecordFile({ name: 'Constanza Elizondo', rut: '9876543-3', data: DEMO_BOOTSTRAP }),
    ) as { tratamientoActivo: { nombre: string }[]; patologia: string };
    expect(file.patologia).toBe('Fibromialgia + Depresión');
    expect(file.tratamientoActivo.map((med) => med.nombre)).toEqual(['Paracetamol', 'Gabapentina']);
  });
});
