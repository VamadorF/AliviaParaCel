import type { PatientRepository } from '@/features/patient/api/patientRepository';
import { repliesOf, threadsOf } from '@/features/patient/community/forum';
import type { ForumPost, ForumReport, PatientBootstrap } from '@/features/patient/types';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';

export type ReportRejectReason = 'empty' | 'missing-post' | 'own-post';

export type CommunityReportInput = {
  id: string;
  postId: string;
  reporterRut: string;
  reporterAuthor: string;
  reason: string;
  at: string;
};

export type ReportWrite =
  | { ok: true; data: PatientBootstrap }
  | { ok: false; reason: ReportRejectReason };

export function authorSeesHidden(post: ForumPost, viewerAuthor: string): boolean {
  return post.hidden === true && post.author === viewerAuthor;
}

/** La autora sigue viendo la suya. El resto no ve una publicación ocultada. */
export function visibleTo(post: ForumPost, viewerAuthor: string): boolean {
  return post.hidden !== true || post.author === viewerAuthor;
}

export function shownThreads(posts: ForumPost[], viewerAuthor: string): ForumPost[] {
  return threadsOf(posts).filter((post) => visibleTo(post, viewerAuthor));
}

export function shownReplies(
  posts: ForumPost[],
  topicId: string,
  viewerAuthor: string,
): ForumPost[] {
  return repliesOf(posts, topicId).filter((post) => visibleTo(post, viewerAuthor));
}

/**
 * Marca una publicación como ocultada.
 * En el móvil no hay cola de admin: el fixture o esta función dejan el estado para que la autora lo vea.
 * Si no existe o ya estaba ocultada, devuelve el mismo objeto.
 */
export function hideCommunityPost(data: PatientBootstrap, postId: string): PatientBootstrap {
  const post = data.posts.find((item) => item.id === postId);
  if (!post || post.hidden) return data;
  return {
    ...data,
    posts: data.posts.map((item) => (item.id === postId ? { ...item, hidden: true } : item)),
  };
}

export function appendCommunityReport(
  data: PatientBootstrap,
  input: CommunityReportInput,
): ReportWrite {
  const reason = input.reason.trim();
  if (!reason) return { ok: false, reason: 'empty' };
  const post = data.posts.find((item) => item.id === input.postId);
  if (!post) return { ok: false, reason: 'missing-post' };
  if (post.author === input.reporterAuthor) return { ok: false, reason: 'own-post' };
  const reports = data.forumReports ?? [];
  const reporterRut = input.reporterRut.trim();
  if (
    reports.some(
      (report) =>
        report.id === input.id ||
        (report.postId === input.postId && report.reporterRut === reporterRut),
    )
  ) {
    return { ok: true, data };
  }
  const report: ForumReport = {
    id: input.id,
    postId: input.postId,
    reporterRut,
    reason,
    status: 'abierto',
    createdAt: input.at,
  };
  return {
    ok: true,
    data: {
      ...data,
      forumReports: [report, ...reports],
      posts: data.posts.map((item) =>
        item.id === input.postId ? { ...item, reportCount: (item.reportCount ?? 0) + 1 } : item,
      ),
    },
  };
}

export async function persistCommunityReport(
  repository: Pick<PatientRepository, 'loadBootstrap' | 'saveBootstrap'>,
  userId: string,
  profile: PatientProfileKind,
  input: CommunityReportInput,
): Promise<ReportWrite> {
  const current = await repository.loadBootstrap(userId, profile);
  const next = appendCommunityReport(current, input);
  if (!next.ok || next.data === current) return next;
  const saved = await repository.saveBootstrap(userId, next.data);
  return { ok: true, data: saved };
}
