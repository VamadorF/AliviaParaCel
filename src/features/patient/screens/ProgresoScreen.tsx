import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { dailyPainSeries, PainChart } from '@/shared/charts/PainChart';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { patientProgress } from '@/features/patient/utils/progress';
import { formatDecimal } from '@/shared/format/es-cl';
import { painLabel, painPlate } from '@/features/patient/utils/pain';
import { moodLabel } from '@/shared/data/mood-options';
import { useTheme } from '@/shared/theme/ThemeContext';

export function ProgresoScreen() {
  const { palette, mode } = useTheme();
  const navigation = useNavigation();
  const { data } = usePatientSession();
  const today = new Date().toISOString().slice(0, 10);
  const progress = useMemo(() => patientProgress(data.checkIns, today), [data.checkIns, today]);
  const series = useMemo(() => dailyPainSeries(data.checkIns), [data.checkIns]);
  const statBg = mode === 'dark' ? palette.background : palette.surfaceMuted;

  return (
    <Screen>
      <Button label="← Volver al diario" variant="ghost" onPress={() => navigation.goBack()} />
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        Mi progreso
      </Text>
      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: statBg }]}>
          <Text style={[styles.statValue, { color: palette.textPrimary }]}>{progress.streak}</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>días de racha</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: statBg }]}>
          <Text style={[styles.statValue, { color: palette.textWarning }]}>{progress.painAvg7}</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>dolor prom. 7d</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: statBg }]}>
          <Text style={[styles.statValue, { color: palette.text }]}>{progress.total}</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>registros</Text>
        </View>
      </View>
      <Card style={styles.block}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Evolución del dolor</Text>
        <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 8 }}>
          Escala EVA 0–10 · promedio de cada día
        </Text>
        {progress.chartMessage ? (
          <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 20 }}>
            {progress.chartMessage}
          </Text>
        ) : (
          <PainChart values={series} gridColor={palette.border} labelColor={palette.textMuted} />
        )}
      </Card>
      <Card style={styles.block}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Registros recientes</Text>
        {progress.recent.length === 0 ? (
          <Text style={{ color: palette.textMuted }}>Sin registros anteriores todavía.</Text>
        ) : (
          progress.recent.map((r) => (
            <View key={r.id} style={[styles.row, { borderColor: palette.border }]}>
              <View
                style={[styles.painDot, { backgroundColor: painPlate(r.pain) }]}
                accessibilityLabel={`Dolor ${formatDecimal(r.pain)}, ${painLabel(r.pain)}`}
              >
                <Text style={[styles.painNum, { color: palette.onPrimary }]}>
                  {formatDecimal(r.pain)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: palette.text }}>
                  {r.date} · {r.time}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 13 }}>
                  {r.zones.join(' · ') || 'Sin zonas'}
                  {moodLabel(r.mood) ? ` · ${moodLabel(r.mood)}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '800', marginVertical: 12 },
  block: { marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  painDot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painNum: { fontWeight: '800', fontSize: 15 },
});
