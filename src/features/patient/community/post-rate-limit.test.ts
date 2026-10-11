import { describe, expect, it } from 'vitest';
import { appendCommunityPost } from '@/features/patient/community/forum';
import {
  COMMUNITY_POSTS_PER_HOUR,
  communityPostRateLimitMessage,
  isCommunityPostRateLimited,
} from '@/features/patient/community/post-rate-limit';
import { DEMO_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import type { PatientBootstrap } from '@/features/patient/types';

describe('COM-07 · límite publicaciones/hora', () => {
  it('cuenta publicaciones del autor en la última hora', () => {
    const at = '2026-10-10T12:00:00.000Z';
    const posts = Array.from({ length: COMMUNITY_POSTS_PER_HOUR }, (_, i) => ({
      id: `p${i}`,
      author: 'Ana',
      excerpt: 'x',
      at: new Date(Date.parse(at) - i * 600_000).toISOString(),
      authorRut: '1-1',
    }));
    expect(isCommunityPostRateLimited(posts, '1-1', at)).toBe(true);
    expect(communityPostRateLimitMessage()).toMatch(/publicaciones por hora/);
  });

  it('el mock rechaza con rate-limit', () => {
    const at = '2026-10-10T12:00:00.000Z';
    const posts = Array.from({ length: COMMUNITY_POSTS_PER_HOUR }, (_, i) => ({
      id: `p${i}`,
      author: 'Ana',
      excerpt: 'x',
      at: new Date(Date.parse(at) - i * 600_000).toISOString(),
      authorRut: '1-1',
    }));
    const data: PatientBootstrap = { ...DEMO_BOOTSTRAP, posts };
    const result = appendCommunityPost(data, {
      id: 'nuevo',
      author: 'Ana',
      authorRut: '1-1',
      text: 'otra más',
      at,
      parentId: null,
    });
    expect(result).toEqual({ ok: false, reason: 'rate-limit' });
  });
});
