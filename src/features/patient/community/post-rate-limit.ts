import type { ForumPost } from '@/features/patient/types';

/** COM-07 · Límite de publicaciones (temas y respuestas) por hora en el mock. */
export const COMMUNITY_POSTS_PER_HOUR = 5;

const HOUR_MS = 60 * 60 * 1000;

export function communityPostsInLastHour(
  posts: readonly ForumPost[],
  authorRut: string | undefined,
  atIso: string,
): number {
  if (!authorRut) return 0;
  const at = Date.parse(atIso);
  if (Number.isNaN(at)) return 0;
  const windowStart = at - HOUR_MS;
  return posts.filter((post) => {
    if (post.authorRut !== authorRut) return false;
    const created = Date.parse(post.at);
    return !Number.isNaN(created) && created >= windowStart && created <= at;
  }).length;
}

export function communityPostRateLimitMessage(limit = COMMUNITY_POSTS_PER_HOUR): string {
  return `Llegaste al límite de ${limit} publicaciones por hora. Espera un momento antes de volver a escribir.`;
}

export function isCommunityPostRateLimited(
  posts: readonly ForumPost[],
  authorRut: string | undefined,
  atIso: string,
  limit = COMMUNITY_POSTS_PER_HOUR,
): boolean {
  return communityPostsInLastHour(posts, authorRut, atIso) >= limit;
}
