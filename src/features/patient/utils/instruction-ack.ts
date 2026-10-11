import type { PatientBootstrap } from '@/features/patient/types';

/** Fecha ISO del acuse de la instrucción vigente, o null si sigue sin leer. */
export function instructionReadAt(
  data: Pick<PatientBootstrap, 'instruction' | 'instructionAcks'>,
): string | null {
  const instruction = data.instruction;
  if (!instruction || !Number.isInteger(instruction.id) || instruction.id <= 0) return null;
  const hit = (data.instructionAcks ?? []).find((ack) => ack.alertId === instruction.id && ack.readAt);
  return hit?.readAt ?? null;
}

/** Misma etiqueta que la web (`formatInstructionRead`, PAC-08). */
export function formatInstructionRead(iso: string): string {
  const label = new Date(iso).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `Leída el ${label}`;
}

/**
 * Acusa la instrucción vigente con la fecha real (`at`, ISO).
 * Si no hay instrucción, o ya estaba acusada, devuelve el mismo objeto (sin duplicar ni pisar la fecha).
 */
export function acknowledgeInstruction(data: PatientBootstrap, at: string): PatientBootstrap {
  const instruction = data.instruction;
  const readAt = at.trim();
  if (!instruction || !Number.isInteger(instruction.id) || instruction.id <= 0 || !instruction.text.trim() || !readAt) return data;
  if (instructionReadAt(data)) return data;
  return {
    ...data,
    instructionAcks: [{ alertId: instruction.id, readAt }, ...(data.instructionAcks ?? [])],
  };
}
