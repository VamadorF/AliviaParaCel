import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { dailyPainSeries, PainChart } from '@/shared/charts/PainChart';
import { IconTile } from '@/shared/icons/AppIcon';
import type { DiarioStackParamList } from '@/shared/types/navigation';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { ConsentBanner } from '@/features/patient/components/ConsentBanner';
import { isSharedWithTeam } from '@/features/patient/utils/consent';
import { painColor, painLabel } from '@/features/patient/utils/pain';
import { useTheme } from '@/shared/theme/ThemeContext';

function todayLabel() {
  const d = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export function DiarioScreen() {
  const { palette, mode } = useTheme();
  const { user } = useAuth();
  const { data } = usePatientSession();
  const navigation =
    useNavigation<NativeStackNavigationProp<DiarioStackParamList>>();

  const firstName = user?.name.split(' ')[0] ?? '';
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = data.checkIns.filter((c) => c.date === today);

  const streak = useMemo(() => {
    const dates = new Set(data.checkIns.map((c) => c.date));
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      if (dates.has(d)) count++;
      else if (i > 0) break;
    }
    return count;
  }, [data.checkIns]);

  const series = useMemo(() => dailyPainSeries(data.checkIns), [data.checkIns]);
  const recent = series.slice(-7);
  const painAvg7 = recent.length
    ? (recent.reduce((sum, value) => sum + value, 0) / recent.length).toFixed(1)
    : '—';
  const promptBg = mode === 'dark' ? '#1e4d38' : '#2b7a58';
  const crisisBg = mode === 'dark' ? palette.surface : '#fbf6f3';
  const crisisBorder = mode === 'dark' ? palette.border : '#f3e3dc';
  const warnBg = mode === 'dark' ? '#3a2428' : '#fbe9ea';

  return (
    <Screen>
      <BetaBanner />
      <ConsentBanner context="diario" />
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        Mi Diario
      </Text>
      <Text style={[styles.sub, { color: palette.textMuted }]}>
        Hola {firstName} · {todayLabel()}
        {streak >= 2 ? (
          <Text style={{ color: palette.primary, fontWeight: '700' }}>
            {' '}
            · Racha de {streak} días
          </Text>
        ) : null}
      </Text>

      {data.appointment ? (
        <Card style={styles.block}>
          <View style={styles.iconRow}>
            <IconTile name="calendar" color={palette.primary} background={palette.primarySoft} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: palette.textMuted }]}>PRÓXIMA CONSULTA</Text>
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                {new Date(data.appointment.scheduledAt).toLocaleDateString('es-CL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
              <Text style={{ color: palette.textMuted, marginTop: 4 }}>
                Con {data.appointment.doctorName}
                {data.appointment.reason ? ` · ${data.appointment.reason}` : ''}
              </Text>
            </View>
          </View>
          {data.appointment.status === 'Pendiente' ? (
            <Text style={[styles.badge, { color: palette.warning, backgroundColor: mode === 'dark' ? '#3a2e22' : '#fdf1e4' }]}>
              Por confirmar
            </Text>
          ) : null}
        </Card>
      ) : null}

      {data.instruction ? (
        <Card style={[styles.block, { backgroundColor: palette.accentSoft, borderColor: '#dde5f6' }]}>
          <Text style={[styles.kicker, { color: palette.accent }]}>INSTRUCCIÓN DE TU EQUIPO</Text>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{data.instruction.text}</Text>
        </Card>
      ) : null}

      {todayRecords.length > 0 ? (
        <Card style={styles.block}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Registros de hoy</Text>
          {todayRecords.map((r) => (
            <View key={r.id} style={[styles.row, { backgroundColor: '#f7f9f6' }]}>
              <View
                style={[styles.painDot, { backgroundColor: painColor(r.pain) }]}
                accessibilityLabel={`Dolor ${r.pain.toFixed(1)}, ${painLabel(r.pain)}`}
              >
                <Text style={styles.painNum}>{r.pain.toFixed(1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: palette.text }}>
                  {r.time} · {r.zones.join(' · ') || 'Sin zonas'}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 13 }}>
                  {[r.mood && `Ánimo: ${r.mood}`, r.sleep && `Sueño: ${r.sleep}`]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </Text>
                {!isSharedWithTeam(r) ? (
                  <Text
                    style={{ color: palette.textMuted, fontSize: 12, fontWeight: '800', marginTop: 4 }}
                    testID={`checkin-not-shared-${r.id}`}
                  >
                    No compartido con tu equipo
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </Card>
      ) : (
        <View style={[styles.prompt, { backgroundColor: promptBg }]}>
          <Text style={styles.promptTitle}>¿Cómo te sientes en este momento?</Text>
          <Text style={styles.promptBody}>
            Aún no registras tu bienestar hoy. Toma 30 segundos y ayuda a tu equipo a acompañarte mejor.
          </Text>
        </View>
      )}

      <Button
        label="Actualizar mi bienestar"
        onPress={() => navigation.navigate('Checkin')}
        accessibilityHint="Abre el check-in diario por pasos"
        testID="diario-checkin-cta"
      />

      <Card style={styles.block}>
        <Text style={[styles.cardTitle, { color: palette.text, marginTop: 0 }]}>Evolución del dolor</Text>
        <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 8 }}>
          Escala EVA 0–10 · promedio de cada día
        </Text>
        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: mode === 'dark' ? palette.background : '#f7f9f6' }]}>
            <Text style={[styles.statValue, { color: palette.primary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>días de racha</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: mode === 'dark' ? palette.background : '#f7f9f6' }]}>
            <Text style={[styles.statValue, { color: palette.warning }]}>{painAvg7}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>dolor prom. 7d</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: mode === 'dark' ? palette.background : '#f7f9f6' }]}>
            <Text style={[styles.statValue, { color: palette.text }]}>{data.checkIns.length}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>registros</Text>
          </View>
        </View>
        <PainChart values={series} gridColor={palette.border} labelColor={palette.textMuted} />
      </Card>

      <Pressable
        style={[styles.crisis, { backgroundColor: crisisBg, borderColor: crisisBorder }]}
        onPress={() => navigation.getParent()?.navigate('AlivIA' as never)}
        accessibilityRole="button"
        accessibilityLabel="Dolor muy fuerte o inusual. Ir a AlivIA"
      >
        <IconTile name="warn" color={palette.danger} background={warnBg} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.text, fontWeight: '800' }}>¿Dolor muy fuerte o inusual?</Text>
          <Text style={{ color: palette.textMuted, marginTop: 2 }}>Habla con AlivIA o tu equipo</Text>
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  sub: { fontSize: 14, marginTop: 6, marginBottom: 18, lineHeight: 20 },
  block: { marginBottom: 14 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  painDot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painNum: { color: '#fff', fontWeight: '800', fontSize: 15 },
  prompt: { borderRadius: 20, padding: 22, marginBottom: 14 },
  promptTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  promptBody: { color: 'rgba(255,255,255,0.88)', marginTop: 6, lineHeight: 20, fontSize: 13 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  crisis: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
