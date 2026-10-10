import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Screen } from '@/shared/components/Screen';
import { AppIcon, IconTile } from '@/shared/icons/AppIcon';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import type { Message } from '@/features/patient/types';
import { useTheme } from '@/shared/theme/ThemeContext';

type Channel = 'assistant' | 'team';

const SEGMENTS: { key: Channel; label: string }[] = [
  { key: 'assistant', label: 'Asistente' },
  { key: 'team', label: 'Mi equipo' },
];

const ASSISTANT_GREEN = '#2f8f63';

export function AliviaScreen() {
  const { palette } = useTheme();
  const { data } = usePatientSession();
  const [channel, setChannel] = useState<Channel>('assistant');
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<Record<Channel, Message[]>>({ assistant: [], team: [] });

  const teamAvailable = data.doctorLinked && data.messagingEnabled;
  const doctorName = data.appointment?.doctorName ?? null;

  // Los mensajes del paciente enviados en esta sesión se guardan por canal;
  // los mensajes base se separan por emisor (alivia → asistente, team → equipo).
  const messages = useMemo(() => {
    const base = data.messages;
    const byChannel: Record<Channel, Message[]> = {
      assistant: base.filter((m) => m.from === 'alivia'),
      team: base.filter((m) => m.from === 'team'),
    };
    const patientBase = base.filter((m) => m.from === 'patient');
    byChannel[teamAvailable && byChannel.team.length > 0 ? 'team' : 'assistant'].push(...patientBase);
    const merge = (c: Channel) =>
      [...byChannel[c], ...sent[c]].sort((a, b) => a.at.localeCompare(b.at));
    return { assistant: merge('assistant'), team: merge('team') };
  }, [data.messages, sent, teamAvailable]);

  const showLock = channel === 'team' && !teamAvailable;
  const list = messages[channel];

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setSent((prev) => ({
      ...prev,
      [channel]: [
        ...prev[channel],
        { id: `m-${Date.now()}`, from: 'patient', body, at: new Date().toISOString() },
      ],
    }));
    setDraft('');
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
            renderItem={({ item }) => (
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
                    {item.from === 'patient' ? 'Tú' : item.from === 'team' ? 'Tu equipo' : 'AlivIA'}
                  </Text>
                  <Text style={{ color: palette.text, lineHeight: 21 }}>{item.body}</Text>
                </View>
              </View>
            )}
          />
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
              accessibilityState={{ disabled: !draft.trim() }}
              onPress={send}
              style={({ pressed }) => [
                styles.send,
                { opacity: !draft.trim() ? 0.5 : pressed ? 0.8 : 1 },
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
