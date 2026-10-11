import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import {
  COMMUNITY_MONITOR_NOTICE,
  CRISIS_SIGNALS,
  matchesCrisisSignal,
  MODERATOR_REVIEW_COPY,
} from '@/features/patient/community/crisis-signals';
import { persistCommunityPost } from '@/features/patient/community/forum';
import { shownThreads } from '@/features/patient/community/report';
import { DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';

const demoUser = MOCK_USERS.find((user) => user.rut === DEMO_RUT)!;
const SCREEN = join(dirname(fileURLToPath(import.meta.url)), '..', 'screens', 'ComunidadScreen.tsx');

describe('COM-06 · señales de crisis al publicar', () => {
  it('la lista es corta y no marca un texto cotidiano', () => {
    expect([...CRISIS_SIGNALS]).toEqual([
      'quiero morirme',
      'me quiero morir',
      'no quiero seguir viviendo',
      'me voy a matar',
      'quiero suicidarme',
    ]);
    expect(CRISIS_SIGNALS.length).toBeLessThanOrEqual(8);
    expect(matchesCrisisSignal('Hoy quiero morirme')).toBe(true);
    expect(matchesCrisisSignal('ya no quiero seguir viviendo')).toBe(true);
    expect(matchesCrisisSignal('me duele la espalda desde ayer')).toBe(false);
    expect(COMMUNITY_MONITOR_NOTICE).toBe(
      'La Comunidad no se monitorea en tiempo real. Si estás en riesgo, llama al 131 o al *4141.',
    );
    expect(MODERATOR_REVIEW_COPY).toBe('La revisa un moderador de Mejora Digital en máximo 24 horas.');
  });

  it('la publicación queda en revisión, la ve el autor y no los demás', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const published = await persistCommunityPost(patient, demoUser.id, 'demo', {
      id: 'crisis-1',
      author: 'Constanza E.',
      text: 'ya no quiero seguir viviendo',
      at: '2026-10-10T12:00:00.000Z',
      parentId: null,
    });
    expect(published.ok).toBe(true);
    if (!published.ok) return;
    expect(published.data.posts.find((post) => post.id === 'crisis-1')?.review).toBe('en_revision');
    expect(shownThreads(published.data.posts, 'Constanza E.').some((post) => post.id === 'crisis-1')).toBe(true);
    expect(shownThreads(published.data.posts, 'Ana R.').some((post) => post.id === 'crisis-1')).toBe(false);

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.posts.find((post) => post.id === 'crisis-1')?.review).toBe('en_revision');

    const calm = await persistCommunityPost(patient, demoUser.id, 'demo', {
      id: 'calma-1',
      author: 'Constanza E.',
      text: 'me duele la espalda desde ayer',
      at: '2026-10-10T12:05:00.000Z',
      parentId: null,
    });
    expect(calm.ok).toBe(true);
    if (!calm.ok) return;
    expect(calm.data.posts.find((post) => post.id === 'calma-1')?.review).toBeUndefined();
    expect(shownThreads(calm.data.posts, 'Ana R.').some((post) => post.id === 'calma-1')).toBe(true);
  });

  it('la pantalla muestra el aviso y los teléfonos como tel:', () => {
    const source = readFileSync(SCREEN, 'utf8');
    expect(source).toContain('COMMUNITY_MONITOR_NOTICE');
    expect(source).toContain(".split('131')");
    expect(source).toContain("'tel:131'");
    expect(source).toContain("'tel:*4141'");
    expect(source).toContain('En revisión');
    expect(source).toContain('testID="crisis-ayuda"');
    expect(source).not.toContain('contacto al paciente');
  });
});
