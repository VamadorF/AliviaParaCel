import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { canWriteUserCache } from '@/features/auth/session/session';
import { patientRepository } from '@/features/patient/api/patientApi';
import { patientQueryKeys } from '@/features/patient/api/patientQueryKeys';
import {
  COMMUNITY_MONITOR_NOTICE,
  MODERATOR_REVIEW_COPY,
} from '@/features/patient/community/crisis-signals';
import {
  communityAuthor,
  newCommunityPostId,
  forumRejectMessage,
  persistCommunityPost,
  type ForumRejectReason,
} from '@/features/patient/community/forum';
import { sanitizeAlias } from '@/features/patient/community/alias';
import {
  filterThreadsByPathology,
  pathologyTagOf,
} from '@/features/patient/community/topic-tag';
import {
  authorSeesHidden,
  persistCommunityReport,
  shownReplies,
  shownThreads,
  visibleTo,
  type ReportRejectReason,
} from '@/features/patient/community/report';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import type { ForumPost } from '@/features/patient/types';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Chip } from '@/shared/components/Chip';
import { Screen } from '@/shared/components/Screen';
import { IconTile } from '@/shared/icons/AppIcon';
import { useTheme } from '@/shared/theme/ThemeContext';

const REJECT_COPY: Record<ForumRejectReason, string> = {
  empty: forumRejectMessage('empty'),
  abusive: forumRejectMessage('abusive'),
  'missing-topic': forumRejectMessage('missing-topic'),
  'rate-limit': forumRejectMessage('rate-limit'),
};

const REPORT_COPY: Record<ReportRejectReason, string> = {
  empty: 'Escribe el motivo del reporte.',
  'missing-post': 'Esa publicación ya no está.',
  'own-post': 'No puedes reportar tu propia publicación.',
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ComunidadScreen() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const { data } = usePatientSession();
  const queryClient = useQueryClient();
  const [topicDraft, setTopicDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'danger'; text: string } | null>(null);
  const [useAlias, setUseAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState('');
  const [showAllTopics, setShowAllTopics] = useState(false);

  const viewer = user ? communityAuthor(user.name) : '';
  const crisisHelp = data.posts.some(
    (post) => post.review === 'en_revision' && post.author === viewer,
  );
  const threads = useMemo(() => {
    const base = shownThreads(data.posts, viewer);
    if (showAllTopics) return base;
    return filterThreadsByPathology(base, data.pathology);
  }, [data.posts, viewer, showAllTopics, data.pathology]);
  const opened = activeId
    ? data.posts.find((post) => post.id === activeId && !post.parentId)
    : undefined;
  const active = opened && visibleTo(opened, viewer) ? opened : undefined;
  const replies = useMemo(
    () => (active ? shownReplies(data.posts, active.id, viewer) : []),
    [data.posts, active, viewer],
  );

  function closeReport() {
    setReportPostId(null);
    setReason('');
  }

  function openThread(postId: string) {
    setActiveId(postId);
    setFeedback(null);
    closeReport();
  }

  async function publish(text: string, parentId: string | null) {
    if (!user || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const result = await persistCommunityPost(patientRepository, user.id, user.profile, {
        id: newCommunityPostId(),
        author: communityAuthor(user.name),
        authorRut: user.rut,
        displayAlias: useAlias && !parentId ? sanitizeAlias(aliasDraft) : undefined,
        topicTag: !parentId ? pathologyTagOf(data.pathology) : undefined,
        text,
        at: new Date().toISOString(),
        parentId,
      });
      if (!result.ok) {
        setFeedback({ tone: 'danger', text: REJECT_COPY[result.reason] });
        return;
      }
      if (canWriteUserCache(user.id)) {
        queryClient.setQueryData(patientQueryKeys.bootstrap(user.id), result.data);
      }
      if (parentId) setReplyDraft('');
      else setTopicDraft('');
      setFeedback({
        tone: 'ok',
        text: parentId ? 'Respuesta publicada.' : 'Tema publicado en la comunidad.',
      });
    } catch {
      setFeedback({ tone: 'danger', text: 'No se pudo guardar. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  }

  async function sendReport(postId: string) {
    if (!user || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const result = await persistCommunityReport(patientRepository, user.id, user.profile, {
        id: newCommunityPostId(),
        postId,
        reporterRut: user.rut,
        reporterAuthor: viewer,
        reason,
        at: new Date().toISOString(),
      });
      if (!result.ok) {
        setFeedback({ tone: 'danger', text: REPORT_COPY[result.reason] });
        return;
      }
      if (canWriteUserCache(user.id)) {
        queryClient.setQueryData(patientQueryKeys.bootstrap(user.id), result.data);
      }
      closeReport();
      setFeedback({ tone: 'ok', text: 'Reporte enviado.' });
    } catch {
      setFeedback({ tone: 'danger', text: 'No se pudo guardar el reporte. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  }

  function moderation(post: ForumPost) {
    return (
      <PostModeration
        post={post}
        viewer={viewer}
        open={reportPostId === post.id}
        reason={reason}
        saving={saving}
        onOpen={() => {
          setReportPostId(post.id);
          setReason('');
          setFeedback(null);
        }}
        onChangeReason={setReason}
        onSubmit={() => {
          void sendReport(post.id);
        }}
        onCancel={closeReport}
      />
    );
  }

  return (
    <Screen>
      <BetaBanner />
      <View style={styles.titleRow}>
        <IconTile name="people" color={palette.primary} background={palette.primarySoft} />
        <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
          Comunidad
        </Text>
      </View>
      <View
        style={[styles.disclaimer, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}
        testID="community-disclaimer"
      >
        <Text style={{ color: palette.text, lineHeight: 21 }}>
          Comparte experiencias, no indicaciones médicas. No reemplaza la consulta con tu equipo tratante.
        </Text>
      </View>
      <View
        style={[styles.disclaimer, { backgroundColor: palette.surface, borderColor: palette.border }]}
        testID="community-monitor"
      >
        <MonitorNotice />
      </View>
      {crisisHelp ? <CrisisHelpCard /> : null}

      {feedback ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: feedback.tone === 'danger' ? palette.textDanger : palette.textPrimary,
            marginBottom: 12,
            lineHeight: 20,
          }}
        >
          {feedback.text}
        </Text>
      ) : null}

      {active ? (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al foro"
            onPress={() => {
              setActiveId(null);
              setFeedback(null);
              closeReport();
            }}
            style={styles.back}
          >
            <Text style={{ color: palette.textMuted, fontWeight: '700' }}>Volver al foro</Text>
          </Pressable>
          <Card>
            <Text style={{ fontWeight: '800', color: palette.text, fontSize: 16, lineHeight: 22 }}>
              {active.excerpt}
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 8 }}>
              {active.author} · {formatWhen(active.at)}
            </Text>
            <ReviewMark post={active} />
            {moderation(active)}
          </Card>
          {replies.length === 0 ? (
            <Text style={{ color: palette.textMuted, marginBottom: 12, lineHeight: 20 }}>
              Nadie ha respondido todavía.
            </Text>
          ) : (
            replies.map((reply) => (
              <Card key={reply.id}>
                <Text style={{ fontWeight: '800', color: palette.text }}>{reply.author}</Text>
                <Text style={{ color: palette.text, marginTop: 8, lineHeight: 22 }}>{reply.excerpt}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 8 }}>
                  {formatWhen(reply.at)}
                </Text>
                <ReviewMark post={reply} />
                {moderation(reply)}
              </Card>
            ))
          )}
          <Composer
            value={replyDraft}
            onChangeText={setReplyDraft}
            placeholder="Escribe una respuesta…"
            fieldLabel="Respuesta"
            buttonLabel="Responder"
            saving={saving}
            onSubmit={() => {
              void publish(replyDraft, active.id);
            }}
          />
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <Chip
              label={
                showAllTopics
                  ? 'Mostrando todos los temas'
                  : `Filtrado: ${pathologyTagOf(data.pathology)}`
              }
              selected={!showAllTopics}
              onPress={() => setShowAllTopics((v) => !v)}
            />
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: useAlias }}
            onPress={() => setUseAlias((v) => !v)}
            style={{ marginBottom: 8 }}
          >
            <Text style={{ color: palette.text, fontWeight: '700' }}>
              Publicar con seudónimo {useAlias ? '(activado)' : '(desactivado)'}
            </Text>
          </Pressable>
          {useAlias ? (
            <TextInput
              value={aliasDraft}
              onChangeText={setAliasDraft}
              placeholder="Tu alias visible"
              placeholderTextColor={palette.textMuted}
              style={{
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                color: palette.text,
                backgroundColor: palette.surface,
                minHeight: 48,
              }}
            />
          ) : null}
          <Composer
            value={topicDraft}
            onChangeText={setTopicDraft}
            placeholder="Crea un tema nuevo…"
            fieldLabel="Nuevo tema"
            buttonLabel="Publicar"
            saving={saving}
            onSubmit={() => {
              void publish(topicDraft, null);
            }}
          />
          {threads.map((post) => {
            const replyCount = shownReplies(data.posts, post.id, viewer).length;
            return (
              <Card key={post.id}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${post.excerpt}. ${replyCount} respuestas.`}
                  onPress={() => openThread(post.id)}
                >
                  <Text style={{ fontWeight: '800', color: palette.text }}>{post.author}</Text>
                  {post.topicTag ? (
                    <Text style={{ color: palette.textAccent, fontSize: 11, fontWeight: '800', marginTop: 4 }}>
                      {post.topicTag}
                    </Text>
                  ) : null}
                  <Text
                    numberOfLines={4}
                    style={{ color: palette.text, marginTop: 8, lineHeight: 22 }}
                  >
                    {post.excerpt}
                  </Text>
                  <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 8 }}>
                    {formatWhen(post.at)} · {replyCount}{' '}
                    {replyCount === 1 ? 'respuesta' : 'respuestas'}
                  </Text>
                  <ReviewMark post={post} />
                </Pressable>
                {moderation(post)}
              </Card>
            );
          })}
          {threads.length === 0 ? (
            <View style={styles.empty}>
              <IconTile name="people" color={palette.textMuted} background={palette.primarySoft} size={56} />
              <Text style={{ color: palette.textMuted }}>Sin publicaciones todavía.</Text>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function openTel(href: 'tel:131' | 'tel:*4141') {
  Linking.openURL(href).catch(() => {});
}

function MonitorNotice() {
  const { palette } = useTheme();
  const [before, after] = COMMUNITY_MONITOR_NOTICE.split('131');
  const rest = after.split('*4141');
  return (
    <Text style={{ color: palette.text, lineHeight: 21 }}>
      {before}
      <Text
        accessibilityRole="link"
        accessibilityLabel="Llamar al 131"
        onPress={() => openTel('tel:131')}
        style={{ fontWeight: '800', color: palette.textDanger }}
      >
        131
      </Text>
      {rest[0]}
      <Text
        accessibilityRole="link"
        accessibilityLabel="Llamar al *4141"
        onPress={() => openTel('tel:*4141')}
        style={{ fontWeight: '800', color: palette.textDanger }}
      >
        *4141
      </Text>
      {rest[1]}
    </Text>
  );
}

function CrisisHelpCard() {
  const { palette } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      testID="crisis-ayuda"
      style={[styles.disclaimer, { backgroundColor: palette.surface, borderColor: palette.border }]}
    >
      <Text style={{ fontWeight: '800', color: palette.text, lineHeight: 22 }}>
        <Text
          accessibilityRole="link"
          accessibilityLabel="Llamar al 131, urgencias"
          onPress={() => openTel('tel:131')}
          style={{ color: palette.textDanger }}
        >
          131
        </Text>
        <Text style={{ fontWeight: '600', color: palette.textMuted }}> · urgencias</Text>
      </Text>
      <Text style={{ fontWeight: '800', color: palette.text, lineHeight: 22, marginTop: 6 }}>
        <Text
          accessibilityRole="link"
          accessibilityLabel="Llamar al *4141"
          onPress={() => openTel('tel:*4141')}
          style={{ color: palette.textDanger }}
        >
          *4141
        </Text>
        <Text style={{ fontWeight: '600', color: palette.textMuted }}> · Línea de Prevención del Suicidio</Text>
      </Text>
      <Text style={{ color: palette.textMuted, marginTop: 8, lineHeight: 20 }}>{MODERATOR_REVIEW_COPY}</Text>
    </View>
  );
}

function ReviewMark({ post }: { post: ForumPost }) {
  const { palette } = useTheme();
  if (post.review !== 'en_revision') return null;
  return (
    <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '800', color: palette.textWarning }}>
      En revisión
    </Text>
  );
}

function PostModeration({
  post,
  viewer,
  open,
  reason,
  saving,
  onOpen,
  onChangeReason,
  onSubmit,
  onCancel,
}: {
  post: ForumPost;
  viewer: string;
  open: boolean;
  reason: string;
  saving: boolean;
  onOpen: () => void;
  onChangeReason: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const { palette } = useTheme();
  if (!visibleTo(post, viewer)) return null;
  const mineHidden = authorSeesHidden(post, viewer);
  const canReport = viewer.length > 0 && post.author !== viewer;
  if (!mineHidden && !canReport) return null;

  return (
    <View>
      {mineHidden ? (
        <View
          testID="post-hidden-notice"
          style={[styles.notice, { borderColor: palette.warning }]}
        >
          <Text style={{ color: palette.text, fontWeight: '700', lineHeight: 20 }}>
            Tu publicación fue ocultada.
          </Text>
        </View>
      ) : null}
      {canReport && !open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reportar publicación de ${post.author}`}
          onPress={onOpen}
          disabled={saving}
          style={styles.reportBtn}
          testID="report-post"
        >
          <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>Reportar</Text>
        </Pressable>
      ) : null}
      {canReport && open ? (
        <View style={styles.reportForm}>
          <Text style={{ color: palette.text, fontWeight: '700' }}>Motivo</Text>
          <TextInput
            value={reason}
            onChangeText={onChangeReason}
            placeholder="Describe qué ocurrió"
            placeholderTextColor={palette.textMuted}
            accessibilityLabel="Motivo"
            editable={!saving}
            multiline
            style={[
              styles.input,
              {
                color: palette.text,
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          />
          <Button label="Enviar reporte" onPress={onSubmit} loading={saving} disabled={saving} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar reporte"
            onPress={onCancel}
            disabled={saving}
            style={styles.reportBtn}
          >
            <Text style={{ color: palette.textMuted, fontWeight: '700' }}>Cancelar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Composer({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  fieldLabel,
  buttonLabel,
  saving,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
  fieldLabel: string;
  buttonLabel: string;
  saving: boolean;
}) {
  const { palette } = useTheme();

  return (
    <View style={styles.composer}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        accessibilityLabel={fieldLabel}
        editable={!saving}
        multiline
        style={[
          styles.input,
          {
            color: palette.text,
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      />
      <Button label={buttonLabel} onPress={onSubmit} loading={saving} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: '800' },
  disclaimer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  composer: { gap: 10, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  back: { minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  notice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  reportBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  reportForm: { gap: 10, marginTop: 8 },
});
