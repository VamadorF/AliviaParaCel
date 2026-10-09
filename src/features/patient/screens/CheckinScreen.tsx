import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Chip } from '@/shared/components/Chip';
import { TextField } from '@/shared/components/TextField';
import { IconTile } from '@/shared/icons/AppIcon';
import { EVA_FACES, PainFace } from '@/shared/icons/PainFace';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import type { CheckInRecord, DoseChoice } from '@/features/patient/types';
import { painColor, painLabel } from '@/features/patient/utils/pain';
import { useTheme } from '@/shared/theme/ThemeContext';

const STEPS = 7;
const ZONES = ['Cabeza', 'Cuello', 'Hombro', 'Lumbar', 'Cadera', 'Rodilla', 'Otro'];
const MOODS = ['Bien', 'Regular', 'Cansada', 'Ansiosa'];
const SLEEP = ['< 5 h', '5–6 h', '6–7 h', '7+ h'];

type Draft = {
  emergency: boolean | null;
  emergencyReason: string;
  registrant: 'self' | 'caregiver' | null;
  pain: number;
  zones: string[];
  mood: string;
  sleep: string;
  doses: Record<string, DoseChoice>;
};

function stepBlockers(step: number, draft: Draft): string[] {
  if (step === 0) {
    if (draft.emergency === null) return ['urgencias'];
    if (draft.emergency && !draft.emergencyReason.trim()) return ['motivo de urgencias'];
  }
  if (step === 1 && !draft.registrant) return ['quién registra'];
  if (step === 3 && draft.zones.length === 0) return ['al menos una zona'];
  return [];
}

export function CheckinScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation();
  const { data, saveCheckIn } = usePatientSession();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    emergency: null,
    emergencyReason: '',
    registrant: null,
    pain: 5,
    zones: [],
    mood: '',
    sleep: '',
    doses: Object.fromEntries(data.medications.map((m) => [m.id, 'indicated' as DoseChoice])),
  });

  const blockers = useMemo(() => stepBlockers(step, draft), [step, draft]);

  const goNext = () => {
    if (blockers.length > 0) return;
    if (step < STEPS - 1) setStep((s) => s + 1);
    else submit();
  };

  const submit = () => {
    if (blockers.length > 0 || draft.emergency === null || !draft.registrant) return;
    const now = new Date();
    const record: CheckInRecord = {
      id: `local-${Date.now()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }),
      pain: draft.pain,
      zones: draft.zones,
      mood: draft.mood || undefined,
      sleep: draft.sleep || undefined,
      emergency: draft.emergency,
      registrant: draft.registrant,
      doses: data.medications.map((m) => ({
        medId: m.id,
        choice: draft.doses[m.id] ?? 'indicated',
      })),
    };
    saveCheckIn(record);
    navigation.goBack();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={[styles.step, { color: palette.textMuted }]}
        accessibilityLiveRegion="polite"
      >
        Paso {step + 1} de {STEPS}
      </Text>
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        Check-in diario
      </Text>
      <View style={[styles.notice, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}>
        <IconTile name="shield" color={palette.primary} background={palette.surface} size={32} iconSize={16} />
        <Text style={{ flex: 1, color: palette.text, fontSize: 13, lineHeight: 20 }}>
          AlivIA analiza tus registros para orientarte. Los datos de esta beta son locales.
        </Text>
      </View>

      {blockers.length > 0 ? (
        <Text style={{ color: palette.danger, marginBottom: 12 }}>
          Falta: {blockers.join(', ')}
        </Text>
      ) : null}

      {step === 0 ? (
        <View>
          <Text style={styles.label}>¿Necesitas urgencias ahora?</Text>
          <View style={styles.row}>
            <Chip
              label="No"
              selected={draft.emergency === false}
              onPress={() => setDraft((d) => ({ ...d, emergency: false }))}
            />
            <Chip
              label="Sí"
              selected={draft.emergency === true}
              onPress={() => setDraft((d) => ({ ...d, emergency: true }))}
            />
          </View>
          {draft.emergency ? (
            <TextField
              label="Motivo (obligatorio)"
              value={draft.emergencyReason}
              onChangeText={(t) => setDraft((d) => ({ ...d, emergencyReason: t }))}
            />
          ) : null}
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <Text style={styles.label}>¿Quién registra?</Text>
          <View style={styles.row}>
            <Chip
              label="Yo"
              selected={draft.registrant === 'self'}
              onPress={() => setDraft((d) => ({ ...d, registrant: 'self' }))}
            />
            <Chip
              label="Soy cuidador"
              selected={draft.registrant === 'caregiver'}
              onPress={() => setDraft((d) => ({ ...d, registrant: 'caregiver' }))}
            />
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <Text style={styles.label}>¿Cuánto dolor sientes ahora?</Text>
          <View style={styles.faceHero}>
            <PainFace value={draft.pain} size={84} />
            <Text style={{ fontSize: 36, fontWeight: '800', color: painColor(draft.pain) }}>
              {draft.pain}
            </Text>
            <Text style={{ color: painColor(draft.pain), fontWeight: '700' }}>
              {painLabel(draft.pain)}
            </Text>
          </View>
          <View style={styles.faces}>
            {EVA_FACES.map((face) => {
              const selected = draft.pain === face.num;
              return (
                <Pressable
                  key={face.num}
                  accessibilityRole="button"
                  accessibilityLabel={`${face.label}, ${face.num}`}
                  onPress={() => setDraft((d) => ({ ...d, pain: face.num }))}
                  style={[
                    styles.faceBtn,
                    selected && { backgroundColor: palette.primarySoft },
                  ]}
                >
                  <PainFace value={face.num} size={28} color={selected ? painColor(face.num) : '#b8c4bd'} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: selected ? painColor(face.num) : '#b8c4bd' }}>
                    {face.num}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.painGrid}>
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <Chip
                key={n}
                label={String(n)}
                selected={draft.pain === n}
                onPress={() => setDraft((d) => ({ ...d, pain: n }))}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <Text style={styles.label}>Zonas con dolor</Text>
          <View style={styles.rowWrap}>
            {ZONES.map((z) => (
              <Chip
                key={z}
                label={z}
                selected={draft.zones.includes(z)}
                onPress={() =>
                  setDraft((d) => ({
                    ...d,
                    zones: d.zones.includes(z)
                      ? d.zones.filter((x) => x !== z)
                      : [...d.zones, z],
                  }))
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 4 ? (
        <View>
          <Text style={styles.label}>Ánimo</Text>
          <View style={styles.rowWrap}>
            {MOODS.map((m) => (
              <Chip
                key={m}
                label={m}
                selected={draft.mood === m}
                onPress={() => setDraft((d) => ({ ...d, mood: m }))}
              />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Sueño</Text>
          <View style={styles.rowWrap}>
            {SLEEP.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={draft.sleep === s}
                onPress={() => setDraft((d) => ({ ...d, sleep: s }))}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 5 ? (
        <View>
          <View style={styles.medHead}>
            <IconTile name="pill" color={palette.primary} background={palette.primarySoft} size={36} iconSize={18} />
            <Text style={[styles.label, { marginBottom: 0, color: palette.text }]}>Medicamentos de hoy</Text>
          </View>
          {data.medications.length === 0 ? (
            <Text style={{ color: palette.textMuted, lineHeight: 22 }}>
              Tu médico aún no registra medicamentos activos. Puedes continuar.
            </Text>
          ) : (
            data.medications.map((med) => (
              <View key={med.id} style={{ marginBottom: 16 }}>
                <Text style={[styles.label, { color: palette.text }]}>{med.name}</Text>
                <View style={styles.rowWrap}>
                  {(
                    [
                      ['indicated', 'Lo indicado'],
                      ['more', 'Más'],
                      ['less', 'Menos'],
                      ['skipped', 'No tomé'],
                    ] as const
                  ).map(([key, label]) => (
                    <Chip
                      key={key}
                      label={label}
                      selected={draft.doses[med.id] === key}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          doses: { ...d.doses, [med.id]: key },
                        }))
                      }
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}

      {step === 6 ? (
        <View style={styles.faceHero}>
          <PainFace value={draft.pain} size={64} />
          <Text style={{ color: palette.text, lineHeight: 24, textAlign: 'center' }}>
            Dolor {draft.pain.toFixed(1)} ({painLabel(draft.pain)}). Zonas:{' '}
            {draft.zones.join(', ') || '—'}.
            {draft.emergency ? ' Incluye urgencias.' : ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button label="Atrás" variant="ghost" onPress={() => setStep((s) => s - 1)} />
        ) : (
          <Button label="Cerrar" variant="ghost" onPress={() => navigation.goBack()} />
        )}
        <View style={{ height: 10 }} />
        <Button
          label={step === STEPS - 1 ? 'Guardar registro' : 'Siguiente'}
          onPress={goNext}
          disabled={blockers.length > 0}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40, maxWidth: 640, alignSelf: 'center', width: '100%' },
  step: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  h1: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  painGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  actions: { marginTop: 28 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
  },
  medHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  faceHero: { alignItems: 'center', gap: 4, marginBottom: 12 },
  faces: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  faceBtn: { alignItems: 'center', gap: 3, borderRadius: 10, padding: 4, minWidth: 36 },
});
