import type { PatientRepository } from '@/features/patient/api/patientRepository';
import { matchesCrisisSignal } from '@/features/patient/community/crisis-signals';
import { communityDisplayName, sanitizeAlias } from '@/features/patient/community/alias';
import { moderate } from '@/features/patient/community/moderate';
import { pathologyTagOf } from '@/features/patient/community/topic-tag';
import {
  communityPostRateLimitMessage,
  isCommunityPostRateLimited,
} from '@/features/patient/community/post-rate-limit';
import type { ForumPost, PatientBootstrap } from '@/features/patient/types';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';

export type CommunityPostInput = {
  id: string;
  author: string;
  authorRut?: string;
  displayAlias?: string;
  topicTag?: string;
  text: string;
  at: string;
  parentId: string | null;
};

export type ForumRejectReason = 'empty' | 'abusive' | 'missing-topic' | 'rate-limit';

export function forumRejectMessage(reason: ForumRejectReason): string {
  if (reason === 'rate-limit') return communityPostRateLimitMessage();
  if (reason === 'empty') return 'Escribe algo antes de publicar.';
  if (reason === 'abusive') return 'AlivIA moderó tu publicación: revisa las normas de convivencia.';
  return 'Ese tema ya no está disponible.';
}

export type ForumWrite =
  | { ok: true; data: PatientBootstrap }
  | { ok: false; reason: ForumRejectReason };

export function communityAuthor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Paciente';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export function newCommunityPostId(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (randomUUID) return randomUUID();
  return `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function threadsOf(posts: ForumPost[]): ForumPost[] {
  return posts.filter((post) => !post.parentId).sort((a, b) => b.at.localeCompare(a.at));
}

export function repliesOf(posts: ForumPost[], topicId: string): ForumPost[] {
  return posts
    .filter((post) => post.parentId === topicId)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function appendCommunityPost(
  data: PatientBootstrap,
  input: CommunityPostInput,
): ForumWrite {
  if (moderate(input.text)) {
    return { ok: false, reason: input.text.trim() ? 'abusive' : 'empty' };
  }
  if (data.posts.some((post) => post.id === input.id)) {
    return { ok: true, data };
  }
  if (input.parentId) {
    const parent = data.posts.find((post) => post.id === input.parentId && !post.parentId);
    if (!parent) return { ok: false, reason: 'missing-topic' };
  }
  if (isCommunityPostRateLimited(data.posts, input.authorRut, input.at)) {
    return { ok: false, reason: 'rate-limit' };
  }
  const text = input.text.trim();
  const alias = sanitizeAlias(input.displayAlias ?? '');
  const post: ForumPost = {
    id: input.id,
    author: communityDisplayName({ author: input.author.trim() || 'Paciente', displayAlias: alias }),
    excerpt: text,
    at: input.at,
    parentId: input.parentId,
    ...(input.authorRut ? { authorRut: input.authorRut } : {}),
    ...(alias ? { displayAlias: alias } : {}),
    ...(!input.parentId
      ? { topicTag: input.topicTag?.trim() || pathologyTagOf(data.pathology) }
      : {}),
    ...(matchesCrisisSignal(text) ? { review: 'en_revision' as const } : {}),
  };
  return { ok: true, data: { ...data, posts: [post, ...data.posts] } };
}

export async function persistCommunityPost(
  repository: Pick<PatientRepository, 'loadBootstrap' | 'saveBootstrap'>,
  userId: string,
  profile: PatientProfileKind,
  input: CommunityPostInput,
): Promise<ForumWrite> {
  const current = await repository.loadBootstrap(userId, profile);
  const next = appendCommunityPost(current, input);
  if (!next.ok || next.data === current) return next;
  const saved = await repository.saveBootstrap(userId, next.data);
  return { ok: true, data: saved };
}
