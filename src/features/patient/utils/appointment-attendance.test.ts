import { describe, expect, it } from 'vitest';
import { applyAppointmentAttendance } from '@/features/patient/utils/appointment-attendance';
import { DEMO_BOOTSTRAP } from '@/shared/mocks/patient.mock';

describe('PAC-11 · confirmar consulta', () => {
  it('guarda confirmación y motivo opcional de reprogramación', () => {
    const confirmed = applyAppointmentAttendance(DEMO_BOOTSTRAP, { attendance: 'confirmada' });
    expect(confirmed.appointment?.attendance).toBe('confirmada');
    expect(confirmed.appointment?.status).toBe('Confirmada');

    const reschedule = applyAppointmentAttendance(DEMO_BOOTSTRAP, {
      attendance: 'reprogramar',
      rescheduleReason: 'Viaje de trabajo',
    });
    expect(reschedule.appointment?.attendance).toBe('reprogramar');
    expect(reschedule.appointment?.rescheduleReason).toBe('Viaje de trabajo');
  });
});
