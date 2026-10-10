import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  EMERGENCY_NOTICE,
  NO_MEDICAL_ADVICE_NOTICE,
  assistantBubble,
  assistantContextFrom,
  assistantReply,
  getAssistantMode,
  saveAiSummaryNote,
} from '@/features/patient/assistant/assistant';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import type { Message } from '@/features/patient/types';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Screen } from '@/shared/components/Screen';
import { AppIcon, IconTile } from '@/shared/icons/AppIcon';
import { useTheme } from '@/shared/theme/ThemeContext';

type Channel = 'assistant' | 'team';

const SEGMENTS: { key: Channel; label: string }[] = [
  { key: 'assistant', label: 'Asistente' },
  { key: 'team', label: 'Mi equipo' },
];

const ASSISTANT_GREEN = '#2f8f63';

function call131() {
  Linking.openURL('tel:131').catch(() => {});
}

function placeBaseMessage(message: Message): Channel | 'patient' {
  if (message.channel === 'assistant' || message.channel === 'team') return message.channel;
  if (message.from === 'alivia') return 'assistant';
  if (message.from === 'team') return 'team';
  return 'patient';
}

export function AliviaScreen() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const { data, sendTeamMessage } = usePatientSession();
  const [channel, setChannel] = useState<Channel>('assistant');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [sent, setSent] = useState<Record<Channel, Message[]>>({ assistant: [], team: [] });
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);

  const assistantCtx = useMemo(
    () => assistantContextFrom({ name: user?.name, checkIns: data.checkIns }),
    [user?.name, data.checkIns],
  );

  const teamAvailable = data.doctorLinked && data.messagingEnabled;
  const doctorName = data.appointment?.doctorName ?? null;

  // El asistente sigue en esta sesión (MOB-09). El equipo persiste (MOB-10); sin red queda en la cola (MOB-16).
  const messages = useMemo(() => {
    const byChannel: Record<Channel, Message[]> = { assistant: [], team: [] };
    const unscopedPatient: Message[] = [];
    for (const message of data.messages) {
      const place = placeBaseMessage(message);
      if (place === 'patient') unscopedPatient.push(message);
      else byChannel[place].push(message);
    }
    const legacy = teamAvailable && byChannel.team.length > 0 ? 'team' : 'assistant';
    byChannel[legacy].push(...unscopedPatient);
    const merge = (c: Channel) =>
      [...byChannel[c], ...sent[c]].sort((a, b) => a.at.localeCompare(b.at));
    return { assistant: merge('assistant'), team: merge('team') };
  }, [data.messages, sent, teamAvailable]);

  const showLock = channel === 'team' && !teamAvailable;
  const list = messages[channel];

  const send = () => {
    const body = draft.trim();
    if (!body || sendingRef.current) return;
    const at = new Date();
    if (channel === 'assistant') {
      const reply = assistantReply(body, assistantCtx, getAssistantMode());
      if (!reply) return;
      setSent((prev) => ({
        ...prev,
        assistant: [
          ...prev.assistant,
          { id: `m-${at.getTime()}`, from: 'patient', body, at: at.toISOString() },
          {
            id: `a-${at.getTime()}`,
            from: 'alivia',
            body: reply,
            at: new Date(at.getTime() + 1).toISOString(),
          },
        ],
      }));
      setDraft('');
      return;
    }
    sendingRef.current = true;
    setSending(true);
    void sendTeamMessage(body, at.toISOString())
      .then((status) => {
        if (status === 'empty') return;
        setDraft('');
      })
      .finally(() => {
        sendingRef.current = false;
        setSending(false);
      });
  };

  const patientWrote = messages.assistant.some((m) => m.from === 'patient');

  const sendSummary = () => {
    const lines = messages.assistant.filter((m) => m.from === 'patient').map((m) => m.body);
    saveAiSummaryNote(user?.id ?? 'local', assistantCtx, lines);
    setSummaryNotice('Resumen enviado a tu médico');
  };

  return (
    <Screen scroll={false}>
      <BetaBanner />
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        AlivIA
      </Text>

      <View
        accessibilityRole="tablist"
        style={[styles.segments, { backgroundColor: palette.surface, borderColor: palette.border }]}
      >
        {SEGMENTS.map((s) => {
          const selected = channel === s.key;
          return (
            <Pressable
              key={s.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={s.label}
              onPress={() => {
                setChannel(s.key);
                setDraft('');
              }}
              style={({ pressed }) => [
                styles.segment,
                { backgroundColor: selected ? palette.primary : 'transparent', opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={{ fontSize: 15, fontWeight: '800', color: selected ? '#ffffff' : palette.text }}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {channel === 'assistant' ? (
        <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <IconTile name="spark" color="#ffffff" background={ASSISTANT_GREEN} size={38} iconSize={18} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: palette.text }}>Asistente AlivIA</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
              Disponible para ti, con o sin médico vinculado
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <IconTile
            name="person"
            color={palette.accent}
            background={palette.accentSoft}
            size={38}
            iconSize={18}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: palette.text }}>Mi equipo</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
              {data.doctorLinked
                ? doctorName
                  ? `Médico vinculado: ${doctorName}`
                  : 'Médico vinculado'
                : 'Sin médico vinculado'}
            </Text>
          </View>
        </View>
      )}

      {channel === 'assistant' ? (
        <View style={styles.notice}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={EMERGENCY_NOTICE}
            onPress={call131}
            style={({ pressed }) => [styles.noticeLink, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={{ color: palette.danger, fontWeight: '800', fontSize: 15, lineHeight: 21 }}>
              {EMERGENCY_NOTICE}
            </Text>
          </Pressable>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
            {NO_MEDICAL_ADVICE_NOTICE}
          </Text>
        </View>
      ) : null}

      {showLock ? (
        <View style={styles.locked}>
          <IconTile
            name="lock"
            color={palette.textMuted}
            background={palette.primarySoft}
            size={60}
            iconSize={26}
            shape="circle"
          />
          <Text style={[styles.lockedTitle, { color: palette.text }]}>
            {data.doctorLinked ? 'Canal aún no habilitado' : 'Aún no tienes un médico vinculado'}
          </Text>
          <Text style={{ color: palette.textMuted, lineHeight: 22, textAlign: 'center' }}>
            {data.doctorLinked
              ? 'Tu equipo todavía no activó los mensajes. Mientras tanto, puedes hablar con el Asistente.'
              : 'Cuando tu equipo te invite, podrás escribirles aquí. Mientras tanto, puedes hablar con el Asistente.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir al Asistente"
            onPress={() => setChannel('assistant')}
            style={({ pressed }) => [
              styles.lockedCta,
              { borderColor: palette.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={{ color: palette.primary, fontWeight: '800', fontSize: 15 }}>Ir al Asistente</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
            ListEmptyComponent={
              <Text style={{ color: palette.textMuted, lineHeight: 22, paddingVertical: 12 }}>
                {channel === 'assistant'
                  ? 'Aún no hay mensajes. Cuéntale a AlivIA cómo te sientes.'
                  : 'Aún no hay mensajes con tu equipo. Escribe el primero.'}
              </Text>
            }
            renderItem={({ item }) => {
              const simulated = item.from === 'alivia' ? assistantBubble(item.body) : null;
              return (
                <View
                  style={[
                    styles.bubbleRow,
                    { justifyContent: item.from === 'patient' ? 'flex-end' : 'flex-start' },
                  ]}
                >
                  {item.from !== 'patient' ? (
                    <IconTile
                      name={item.from === 'alivia' ? 'spark' : 'person'}
                      color={item.from === 'alivia' ? '#ffffff' : palette.accent}
                      background={item.from === 'alivia' ? ASSISTANT_GREEN : palette.accentSoft}
                      size={32}
                      iconSize={16}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: item.from === 'patient' ? palette.primarySoft : palette.surface,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12, color: palette.textMuted, marginBottom: 4 }}>
                      {item.from === 'patient' ? 'Tú' : item.from === 'team' ? 'Tu equipo' : 'Asistente AlivIA'}
                    </Text>
                    {simulated ? (
                      <Text
                        accessibilityLabel={simulated.label}
                        style={[styles.simLabel, { color: palette.textMuted }]}
                      >
                        {simulated.label}
                      </Text>
                    ) : null}
                    <Text style={{ color: palette.text, lineHeight: 21 }}>
                      {simulated ? simulated.text : item.body}
                    </Text>
                    {item.syncStatus === 'pending' ? (
                      <Text
                        style={{ color: palette.textMuted, fontSize: 12, fontWeight: '800', marginTop: 6 }}
                        testID={`message-pending-${item.id}`}
                      >
                        pendiente de envío
                      </Text>
                    ) : null}
                    {simulated?.unavailable ? (
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Llamar al 131"
                        onPress={call131}
                        style={({ pressed }) => [styles.call131, { opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Text style={{ color: palette.danger, fontWeight: '800' }}>Llamar al 131</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
          {channel === 'assistant' && patientWrote ? (
            <View style={styles.summaryBox}>
              {summaryNotice ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ color: palette.primary, fontWeight: '700', marginBottom: 8 }}
                >
                  {summaryNotice}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar resumen a mi médico"
                onPress={sendSummary}
                style={({ pressed }) => [
                  styles.summaryBtn,
                  { borderColor: palette.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={{ color: palette.primary, fontWeight: '800', fontSize: 15 }}>
                  Enviar resumen a mi médico
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            <TextInput
              style={[
                styles.input,
                { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface },
              ]}
              placeholder={
                channel === 'assistant' ? 'Cuéntale a AlivIA cómo te sientes' : 'Escribe a tu equipo'
              }
              placeholderTextColor={palette.textMuted}
              value={draft}
              onChangeText={setDraft}
              accessibilityLabel={channel === 'assistant' ? 'Mensaje al Asistente' : 'Mensaje a mi equipo'}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              accessibilityState={{ disabled: !draft.trim() || sending }}
              disabled={!draft.trim() || sending}
              onPress={send}
              style={({ pressed }) => [
                styles.send,
                { opacity: !draft.trim() || sending ? 0.5 : pressed ? 0.8 : 1 },
              ]}
            >
              <AppIcon name="send" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  segments: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  notice: { marginBottom: 12, gap: 4 },
  noticeLink: { minHeight: 48, justifyContent: 'center' },
  simLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  call131: { minHeight: 48, justifyContent: 'center' },
  summaryBox: { marginBottom: 8 },
  summaryBtn: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  locked: { alignItems: 'center', gap: 12, paddingVertical: 28, paddingHorizontal: 12 },
  lockedTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  lockedCta: {
    minHeight: 48,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  bubble: {
    maxWidth: '82%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: ASSISTANT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
