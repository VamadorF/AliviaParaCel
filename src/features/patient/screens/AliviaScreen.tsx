import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Screen } from '@/shared/components/Screen';
import { AppIcon, IconTile } from '@/shared/icons/AppIcon';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { useTheme } from '@/shared/theme/ThemeContext';

export function AliviaScreen() {
  const { palette } = useTheme();
  const { data } = usePatientSession();
  const [draft, setDraft] = useState('');
  const [local, setLocal] = useState(data.messages);

  if (!data.doctorLinked || !data.messagingEnabled) {
    return (
      <Screen>
        <BetaBanner />
        <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
          AlivIA
        </Text>
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
              ? 'Mientras tanto, puedes hablar con AlivIA abajo.'
              : 'Cuando tu equipo te invite, podrás escribirles aquí.'}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <BetaBanner />
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        AlivIA
      </Text>
      <View style={[styles.assistant, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <IconTile name="spark" color="#ffffff" background="#2f8f63" size={38} iconSize={18} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: palette.text }}>Asistente AlivIA</Text>
          <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
            Conoce tus registros
          </Text>
        </View>
      </View>
      <FlatList
        data={local}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
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
                background={item.from === 'alivia' ? '#2f8f63' : palette.accentSoft}
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
          style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
          placeholder="Cuéntale a AlivIA cómo te sientes"
          placeholderTextColor={palette.textMuted}
          value={draft}
          onChangeText={setDraft}
          accessibilityLabel="Mensaje"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          onPress={() => {
            if (!draft.trim()) return;
            setLocal((prev) => [
              ...prev,
              {
                id: `m-${Date.now()}`,
                from: 'patient',
                body: draft.trim(),
                at: new Date().toISOString(),
              },
            ]);
            setDraft('');
          }}
          style={styles.send}
        >
          <AppIcon name="send" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  locked: { alignItems: 'center', gap: 12, paddingVertical: 28, paddingHorizontal: 12 },
  lockedTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  assistant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
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
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2f8f63',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
