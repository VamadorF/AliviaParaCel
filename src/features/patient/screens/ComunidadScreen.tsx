import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { canWriteUserCache } from '@/features/auth/session/session';
import { patientRepository } from '@/features/patient/api/patientApi';
import { patientQueryKeys } from '@/features/patient/api/patientQueryKeys';
import {
  communityAuthor,
  newCommunityPostId,
  persistCommunityPost,
  repliesOf,
  threadsOf,
  type ForumRejectReason,
} from '@/features/patient/community/forum';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { IconTile } from '@/shared/icons/AppIcon';
import { useTheme } from '@/shared/theme/ThemeContext';

const REJECT_COPY: Record<ForumRejectReason, string> = {
  empty: 'Escribe algo antes de publicar.',
  abusive: 'AlivIA moderó tu publicación: revisa las normas de convivencia.',
  'missing-topic': 'Ese tema ya no está disponible.',
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
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'danger'; text: string } | null>(null);

  const threads = useMemo(() => threadsOf(data.posts), [data.posts]);
  const active = activeId
    ? data.posts.find((post) => post.id === activeId && !post.parentId)
    : undefined;
  const replies = useMemo(
    () => (active ? repliesOf(data.posts, active.id) : []),
    [data.posts, active],
  );

  async function publish(text: string, parentId: string | null) {
    if (!user || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const result = await persistCommunityPost(patientRepository, user.id, user.profile, {
        id: newCommunityPostId(),
        author: communityAuthor(user.name),
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

      {feedback ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: feedback.tone === 'danger' ? palette.danger : palette.primary,
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
            const replyCount = data.posts.filter((item) => item.parentId === post.id).length;
            return (
              <Pressable
                key={post.id}
                accessibilityRole="button"
                accessibilityLabel={`${post.excerpt}. ${replyCount} respuestas.`}
                onPress={() => {
                  setActiveId(post.id);
                  setFeedback(null);
                }}
              >
                <Card>
                  <Text style={{ fontWeight: '800', color: palette.text }}>{post.author}</Text>
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
                </Card>
              </Pressable>
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
});
