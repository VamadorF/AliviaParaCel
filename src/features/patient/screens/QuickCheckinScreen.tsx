import { StackActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { IconTile } from '@/shared/icons/AppIcon';
import { EVA_FACES, PainFace } from '@/shared/icons/PainFace';
import { AI_NOTICE_TEXT } from '@/shared/data/ai-notice';
import { ConsentBanner } from '@/features/patient/components/ConsentBanner';
import { Field, OptionChip } from '@/features/patient/components/CheckinFields';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { activeMedications } from '@/features/patient/utils/medications';
import { painColor, painLabel } from '@/features/patient/utils/pain';
import {
  buildQuickCheckIn,
  latestCheckIn,
  quickDraft,
  quickMissing,
  sameAsLast,
} from '@/features/patient/utils/checkin-quick';
import type { DiarioStackParamList } from '@/shared/types/navigation';
import { moodLabel } from '@/shared/data/mood-options';
import { useTheme } from '@/shared/theme/ThemeContext';

function painText(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function QuickCheckinScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<DiarioStackParamList>>();
  const { data, saveCheckIn } = usePatientSession();
  const medications = useMemo(() => activeMedications(data.medications), [data.medications]);
  const last = useMemo(() => latestCheckIn(data.checkIns), [data.checkIns]);
  const [draft, setDraft] = useState(() => quickDraft(medications));

  const missing = quickMissing(draft);
  const canSave = missing.length === 0;

  const submit = () => {
    const now = new Date();
    const record = buildQuickCheckIn(draft, now, `local-${now.getTime()}`);
    if (!record) return;
    saveCheckIn(record);
    navigation.goBack();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        Registro rápido
      </Text>
      <Text style={[styles.lead, { color: palette.textMuted }]}>
        Para un día difícil. Elige una cara o repite tu último registro, y guarda.
      </Text>
      <ConsentBanner context="checkin" />
      <View style={[styles.notice, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}>
        <IconTile name="shield" color={palette.primary} background={palette.surface} size={32} iconSize={16} />
        <Text style={{ flex: 1, color: palette.text, fontSize: 13, lineHeight: 20 }}>{AI_NOTICE_TEXT}</Text>
      </View>

      <Text style={[styles.label, { color: palette.text }]}>¿Necesitas urgencias ahora?</Text>
      <View style={styles.row}>
        <OptionChip
          label="No"
          selected={!draft.emergency}
          onPress={() => setDraft((d) => ({ ...d, emergency: false, emergencyReason: '', emergencyDetail: '' }))}
          accessibilityLabel="Urgencias: No"
          testID="quick-emergency-no"
        />
        <OptionChip
          label="Sí"
          selected={draft.emergency}
          onPress={() => setDraft((d) => ({ ...d, emergency: true }))}
          accessibilityLabel="Urgencias: Sí"
          testID="quick-emergency-yes"
        />
      </View>
      {draft.emergency ? (
        <View>
          <Field
            label="Motivo (obligatorio)"
            value={draft.emergencyReason}
            onChangeText={(t) => setDraft((d) => ({ ...d, emergencyReason: t }))}
            testID="quick-er-reason"
          />
          <Field
            label="¿Qué pasó? (obligatorio)"
            value={draft.emergencyDetail}
            onChangeText={(t) => setDraft((d) => ({ ...d, emergencyDetail: t }))}
            multiline
            testID="quick-er-detail"
          />
        </View>
      ) : null}

      <Text style={[styles.label, { color: palette.text }]}>¿Cuánto dolor sientes ahora?</Text>
      {draft.pain !== null ? (
        <View style={styles.painNow} accessibilityLiveRegion="polite">
          <PainFace value={draft.pain} size={48} />
          <Text style={{ fontSize: 28, fontWeight: '800', color: painColor(draft.pain) }}>{painText(draft.pain)}</Text>
          <Text style={{ color: painColor(draft.pain), fontWeight: '700' }}>{painLabel(draft.pain)}</Text>
        </View>
      ) : (
        <Text style={[styles.hint, { color: palette.textMuted }]}>Elige una cara.</Text>
      )}
      <View style={styles.faces}>
        {EVA_FACES.map((face) => {
          const selected = draft.pain === face.num;
          const color = selected ? painColor(face.num) : palette.text;
          return (
            <Pressable
              key={face.num}
              accessibilityRole="button"
              accessibilityLabel={`${face.label}, ${face.num}`}
              accessibilityState={{ selected }}
              testID={`quick-face-${face.num}`}
              onPress={() => setDraft((d) => ({ ...d, pain: face.num }))}
              style={({ pressed }) => [
                styles.faceBtn,
                {
                  backgroundColor: selected ? palette.primarySoft : palette.surface,
                  borderColor: selected ? palette.primary : palette.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <PainFace value={face.num} size={28} color={color} />
              <Text style={{ fontSize: 12, fontWeight: '800', color }}>{face.num}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Igual que mi último registro"
        variant="ghost"
        disabled={!last}
        onPress={() => setDraft((d) => sameAsLast(d, last))}
        accessibilityHint="Copia zonas, ánimo y sueño. No marca las dosis como tomadas."
        testID="quick-same-as-last"
      />
      {!last ? (
        <Text style={[styles.hint, { color: palette.textMuted }]}>Aún no hay un registro anterior.</Text>
      ) : (
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          Copia zonas, ánimo y sueño. Las dosis no se marcan como tomadas.
        </Text>
      )}
      {draft.usingLast ? (
        <Text
          style={[styles.copied, { color: palette.text }]}
          accessibilityLiveRegion="polite"
          testID="quick-copied"
        >
          Zonas: {draft.zones.join(', ') || 'sin zonas'}. Ánimo: {moodLabel(draft.mood) || 'sin ánimo'}. Sueño:{' '}
          {draft.sleep || 'sin sueño'}.
        </Text>
      ) : null}

      {missing.length > 0 ? (
        <Text style={{ color: palette.danger, marginTop: 12 }} accessibilityLiveRegion="polite" testID="quick-falta">
          Falta: {missing.join(', ')}.
          {draft.pain === null ? ' Elige una cara o usa tu último registro.' : ' Completa el motivo y qué pasó.'}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button label="Guardar registro" onPress={submit} disabled={!canSave} testID="quick-save" />
        <View style={{ height: 10 }} />
        <Button
          label="Registrar con más detalle"
          variant="ghost"
          onPress={() => navigation.dispatch(StackActions.replace('Checkin'))}
          accessibilityHint="Abre el check-in por pasos"
          testID="quick-open-long"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40, maxWidth: 640, alignSelf: 'center', width: '100%' },
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  lead: { fontSize: 16, lineHeight: 22, marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  hint: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 4 },
  copied: { fontSize: 16, lineHeight: 22, marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  faceBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  painNow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
  },
  actions: { marginTop: 20 },
});
