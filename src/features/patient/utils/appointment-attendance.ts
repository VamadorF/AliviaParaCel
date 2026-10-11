import type { Appointment, AppointmentAttendance, PatientBootstrap } from '@/features/patient/types';

export type AttendanceInput = {
  attendance: AppointmentAttendance;
  rescheduleReason?: string;
};

export function applyAppointmentAttendance(
  data: PatientBootstrap,
  input: AttendanceInput,
): PatientBootstrap {
  if (!data.appointment) return data;
  const reason =
    input.attendance === 'reprogramar' ? (input.rescheduleReason ?? '').trim() : '';
  return {
    ...data,
    appointment: {
      ...data.appointment,
      attendance: input.attendance,
      rescheduleReason: reason || undefined,
      status: input.attendance === 'confirmada' ? 'Confirmada' : data.appointment.status,
    },
  };
}

export function attendanceLabel(appointment: Appointment | null): string | null {
  if (!appointment?.attendance) return null;
  if (appointment.attendance === 'confirmada') return 'Asistencia confirmada';
  return appointment.rescheduleReason?.trim()
    ? `Pediste reprogramar: ${appointment.rescheduleReason.trim()}`
    : 'Pediste reprogramar la consulta';
}
