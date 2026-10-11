import { describe, expect, it } from 'vitest';
import { filterThreadsByPathology, pathologyTagOf } from '@/features/patient/community/topic-tag';
import type { ForumPost } from '@/features/patient/types';

const thread = (tag: string): ForumPost => ({
  id: 't1',
  author: 'Ana',
  excerpt: 'Hola',
  at: new Date().toISOString(),
  topicTag: tag,
});

describe('COM-04 · temas por patología', () => {
  it('toma la primera patología compuesta', () => {
    expect(pathologyTagOf('Fibromialgia + Depresión')).toBe('Fibromialgia');
  });

  it('filtra hilos por la patología del paciente', () => {
    const threads = [thread('Fibromialgia'), thread('Migraña')];
    const filtered = filterThreadsByPathology(threads, 'Fibromialgia + Depresión');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].topicTag).toBe('Fibromialgia');
  });
});
