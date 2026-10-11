import { describe, expect, it } from 'vitest';
import { persistCommunityPost } from '@/features/patient/community/forum';
import { moderate } from '@/features/patient/community/moderate';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import { DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';

const demoUser = MOCK_USERS.find((user) => user.rut === DEMO_RUT)!;

describe('MOB-11 · moderate', () => {
  it('rechaza vacío y contenido abusivo, y deja pasar un tema normal', () => {
    expect(moderate('')).toBe(true);
    expect(moderate('   ')).toBe(true);
    expect(moderate('Eres un idiota')).toBe(true);
    expect(moderate('qué inútil')).toBe(true);
    expect(moderate('Me ayudó el calor local por la mañana')).toBe(false);
  });
});

describe('MOB-11 · persistir publicación y respuesta', () => {
  it('guarda el tema y la respuesta en el repositorio y los recupera al recargar', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const before = await patient.loadBootstrap(demoUser.id, 'demo');

    const published = await persistCommunityPost(patient, demoUser.id, 'demo', {
      id: 'tema-1',
      author: 'Constanza E.',
      text: 'Me ayudó el calor local por la mañana',
      at: '2026-10-10T12:00:00.000Z',
      parentId: null,
    });
    expect(published.ok).toBe(true);

    const replied = await persistCommunityPost(patient, demoUser.id, 'demo', {
      id: 'resp-1',
      author: 'Constanza E.',
      text: 'Gracias por contarlo',
      at: '2026-10-10T13:00:00.000Z',
      parentId: 'tema-1',
    });
    expect(replied.ok).toBe(true);

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.posts.find((post) => post.id === 'tema-1')).toMatchObject({
      excerpt: 'Me ayudó el calor local por la mañana',
      parentId: null,
    });
    expect(reloaded.posts.find((post) => post.id === 'resp-1')).toMatchObject({
      excerpt: 'Gracias por contarlo',
      parentId: 'tema-1',
    });
    expect(reloaded.posts.length).toBe(before.posts.length + 2);
  });

  it('no escribe texto vacío ni abusivo', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const before = await patient.loadBootstrap(demoUser.id, 'demo');

    const empty = await persistCommunityPost(patient, demoUser.id, 'demo', {
      id: 'vacio',
      author: 'Constanza E.',
      text: '   ',
      at: '2026-10-10T12:00:00.000Z',
      parentId: null,
    });
    const abusive = await persistCommunityPost(patient, demoUser.id, 'demo', {
      id: 'abuso',
      author: 'Constanza E.',
      text: 'esto es basura',
      at: '2026-10-10T12:01:00.000Z',
      parentId: null,
    });

    expect(empty).toEqual({ ok: false, reason: 'empty' });
    expect(abusive).toEqual({ ok: false, reason: 'abusive' });

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.posts.map((post) => post.id)).toEqual(before.posts.map((post) => post.id));
  });
});
