import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createMockPatientRepository } from '@/features/patient/api/mockPatientRepository';
import { communityAuthor } from '@/features/patient/community/forum';
import {
  appendCommunityReport,
  authorSeesHidden,
  hideCommunityPost,
  persistCommunityReport,
  shownThreads,
} from '@/features/patient/community/report';
import { fixtureForProfile } from '@/shared/mocks/patient.mock';
import { DEMO_RUT, MOCK_USERS } from '@/shared/mocks/users.mock';
import { createMemoryStorage } from '@/shared/storage/storagePort';

const AT = '2026-10-10T18:00:00.000Z';
const demoUser = MOCK_USERS.find((user) => user.rut === DEMO_RUT)!;
const constanza = communityAuthor('Constanza Elizondo');
const SCREEN = join(dirname(fileURLToPath(import.meta.url)), '..', 'screens', 'ComunidadScreen.tsx');

function visibleSource(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('COM-01 · reportar una publicación', () => {
  it('guarda el reporte en el mock y lo recupera al recargar', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const before = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(before.posts.find((post) => post.id === 'p1')?.reportCount).toBeUndefined();

    const saved = await persistCommunityReport(patient, demoUser.id, 'demo', {
      id: 'rep-1',
      postId: 'p1',
      reporterRut: demoUser.rut,
      reporterAuthor: constanza,
      reason: '  Contenido ofensivo  ',
      at: AT,
    });

    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.data.forumReports?.[0]).toEqual({
      id: 'rep-1',
      postId: 'p1',
      reporterRut: demoUser.rut,
      reason: 'Contenido ofensivo',
      status: 'abierto',
      createdAt: AT,
    });
    expect(saved.data.posts.find((post) => post.id === 'p1')?.reportCount).toBe(1);
    expect(saved.data.posts.find((post) => post.id === 'p1')?.hidden).toBeUndefined();

    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    expect(reloaded.forumReports).toEqual(saved.data.forumReports);
    expect(reloaded.posts.find((post) => post.id === 'p1')?.reportCount).toBe(1);
  });

  it('no duplica el reporte de la misma persona ni escribe motivo vacío, propio o inexistente', async () => {
    const storage = createMemoryStorage();
    const key = `@alivia/patient-bootstrap/v1/${demoUser.id}`;
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    await patient.loadBootstrap(demoUser.id, 'demo');

    const empty = await persistCommunityReport(patient, demoUser.id, 'demo', {
      id: 'rep-vacio',
      postId: 'p1',
      reporterRut: demoUser.rut,
      reporterAuthor: constanza,
      reason: '   ',
      at: AT,
    });
    const missing = await persistCommunityReport(patient, demoUser.id, 'demo', {
      id: 'rep-nada',
      postId: 'no-esta',
      reporterRut: demoUser.rut,
      reporterAuthor: constanza,
      reason: 'Spam',
      at: AT,
    });
    const own = await persistCommunityReport(patient, demoUser.id, 'demo', {
      id: 'rep-propia',
      postId: 'p3',
      reporterRut: demoUser.rut,
      reporterAuthor: constanza,
      reason: 'No me gusta',
      at: AT,
    });
    expect(empty).toEqual({ ok: false, reason: 'empty' });
    expect(missing).toEqual({ ok: false, reason: 'missing-post' });
    expect(own).toEqual({ ok: false, reason: 'own-post' });

    const first = await persistCommunityReport(patient, demoUser.id, 'demo', {
      id: 'rep-1',
      postId: 'p1',
      reporterRut: demoUser.rut,
      reporterAuthor: constanza,
      reason: 'Contenido ofensivo',
      at: AT,
    });
    expect(first.ok).toBe(true);
    const stored = await storage.getItem(key);

    const again = await persistCommunityReport(patient, demoUser.id, 'demo', {
      id: 'rep-2',
      postId: 'p1',
      reporterRut: demoUser.rut,
      reporterAuthor: constanza,
      reason: 'Spam',
      at: '2026-10-10T19:00:00.000Z',
    });
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.data.forumReports).toHaveLength(1);
    expect(again.data.forumReports?.[0].reason).toBe('Contenido ofensivo');
    expect(again.data.posts.find((post) => post.id === 'p1')?.reportCount).toBe(1);
    expect(await storage.getItem(key)).toBe(stored);

    const base = fixtureForProfile('demo');
    const next = appendCommunityReport(base, {
      id: 'rep-1',
      postId: 'p1',
      reporterRut: demoUser.rut,
      reporterAuthor: constanza,
      reason: 'Contenido ofensivo',
      at: AT,
    });
    expect(base.forumReports).toBeUndefined();
    expect(next.ok && next.data.forumReports).toHaveLength(1);
  });
});

describe('COM-01 · publicación ocultada', () => {
  it('el fixture deja ocultada la publicación de Constanza y solo ella la ve', () => {
    const data = fixtureForProfile('demo');
    const post = data.posts.find((item) => item.id === 'p3');
    expect(post?.author).toBe(constanza);
    expect(post?.hidden).toBe(true);
    expect(authorSeesHidden(post!, constanza)).toBe(true);
    expect(authorSeesHidden(post!, 'Ana R.')).toBe(false);
    expect(shownThreads(data.posts, constanza).some((item) => item.id === 'p3')).toBe(true);
    expect(shownThreads(data.posts, 'Ana R.').some((item) => item.id === 'p3')).toBe(false);
  });

  it('hideCommunityPost persiste el estado oculto para que la autora lo vea', async () => {
    const storage = createMemoryStorage();
    const patient = createMockPatientRepository({ storage, delayMs: 0 });
    const current = await patient.loadBootstrap(demoUser.id, 'demo');
    expect(hideCommunityPost(current, 'no-esta')).toBe(current);

    const hidden = hideCommunityPost(current, 'p1');
    expect(hidden).not.toBe(current);
    expect(hideCommunityPost(hidden, 'p1')).toBe(hidden);
    expect(current.posts.find((post) => post.id === 'p1')?.hidden).toBeUndefined();

    await patient.saveBootstrap(demoUser.id, hidden);
    const reloaded = await createMockPatientRepository({ storage, delayMs: 0 }).loadBootstrap(
      demoUser.id,
      'demo',
    );
    const post = reloaded.posts.find((item) => item.id === 'p1');
    expect(post?.hidden).toBe(true);
    expect(authorSeesHidden(post!, 'Ana R.')).toBe(true);
    expect(shownThreads(reloaded.posts, 'Ana R.').some((item) => item.id === 'p1')).toBe(true);
    expect(shownThreads(reloaded.posts, constanza).some((item) => item.id === 'p1')).toBe(false);
  });
});

describe('COM-01 · pantalla', () => {
  it('ofrece Reportar y el aviso al autor, sin repetir el aviso legal', () => {
    const source = visibleSource(readFileSync(SCREEN, 'utf8'));
    expect(source).toContain('>Reportar<');
    expect(source).toContain('Tu publicación fue ocultada.');
    expect(source).toContain('accessibilityLabel="Motivo"');
    const legal = source.match(/No reemplaza la consulta con tu equipo tratante/g) ?? [];
    expect(legal).toHaveLength(1);
  });
});
