import type { TeamInstruction } from '@/features/patient/types';

/** PAC-09 · Instrucción vigente destacada e historial con fechas. */
export function instructionTimeline(
  current: TeamInstruction | null,
  history: TeamInstruction[] | undefined,
): { current: TeamInstruction | null; previous: TeamInstruction[] } {
  const previous = [...(history ?? [])].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
  if (!current?.text.trim()) return { current: null, previous };
  const withoutDup = previous.filter((row) => row.id !== current.id);
  return { current, previous: withoutDup };
}

export function formatInstructionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}
