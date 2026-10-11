import type { ForumPost } from '@/features/patient/types';

/** COM-04 · Etiqueta de patología por hilo y filtro por la del paciente. */
export function pathologyTagOf(pathology: string | null | undefined): string {
  const label = (pathology ?? '').trim();
  if (!label) return 'General';
  const first = label.split('+')[0]?.trim() ?? label;
  return first;
}

export function threadMatchesPathology(thread: ForumPost, pathology: string | null | undefined): boolean {
  const tag = thread.topicTag ?? 'General';
  const patientTag = pathologyTagOf(pathology);
  if (patientTag === 'General') return true;
  return tag.toLowerCase().includes(patientTag.toLowerCase().split(' ')[0] ?? patientTag);
}

export function filterThreadsByPathology(
  threads: ForumPost[],
  pathology: string | null | undefined,
): ForumPost[] {
  return threads.filter((thread) => threadMatchesPathology(thread, pathology));
}
