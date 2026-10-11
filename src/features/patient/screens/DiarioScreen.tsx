import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { PainChart } from '@/shared/charts/PainChart';
import { IconTile } from '@/shared/icons/AppIcon';
import type { DiarioStackParamList } from '@/shared/types/navigation';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { ConsentBanner } from '@/features/patient/components/ConsentBanner';
import { PreConsultBlock } from '@/features/patient/components/PreConsultBlock';
import { isSharedWithTeam } from '@/features/patient/utils/consent';
import { EMERGENCY_TEL, centerPhoneOf, telHref } from '@/features/patient/utils/crisis';
import { painLabel, painPlate } from '@/features/patient/utils/pain';
import { reliefHelpDetail, reliefHelpOf } from '@/features/patient/utils/relief-help';
import { moodLabel } from '@/shared/data/mood-options';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  formatInstructionRead,
  instructionReadAt,
} from '@/features/patient/utils/instruction-ack';
import { attendanceLabel } from '@/features/patient/utils/appointment-attendance';
import {
  formatInstructionDate,
  instructionTimeline,
} from '@/features/patient/utils/instruction-history';
import { checkInSecondaryLine } from '@/features/patient/utils/checkin-summary';
import { patientProgress } from '@/features/patient/utils/progress';
import { guideCardsForPathology } from '@/shared/data/guide-content';
import { formatDecimal } from '@/shared/format/es-cl';

function openDialer(number: string) {
  Linking.openURL(telHref(number)).catch(() => {});
}

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
  const {
    data,
    acknowledgeInstruction,
    isAcknowledgingInstruction,
    submitPreConsult,
    isSubmittingPreConsult,
    submitAppointmentAttendance,
    isSubmittingAppointmentAttendance,
  } = usePatientSession();
  const [rescheduleReason, setRescheduleReason] = useState('');
  const navigation =
    useNavigation<NativeStackNavigationProp<DiarioStackParamList>>();

  const firstName = user?.name.split(' ')[0] ?? '';
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = data.checkIns.filter((c) => c.date === today);

  const centerPhone = centerPhoneOf(data.clinic);
  const instructionRead = instructionReadAt(data);
  const todayIso = today;
  const progress = useMemo(() => patientProgress(data.checkIns, todayIso), [data.checkIns, todayIso]);
  const helped = useMemo(() => reliefHelpOf(data.checkIns), [data.checkIns]);
  const instructions = useMemo(
    () => instructionTimeline(data.instruction, data.instructionHistory),
    [data.instruction, data.instructionHistory],
  );
  const guides = useMemo(
    () => guideCardsForPathology(data.pathology ?? ''),
    [data.pathology],
  );
  const promptBg = mode === 'dark' ? palette.promptSurfaceDark : palette.prompt;
  const crisisBg = palette.crisisSurface;
  const crisisBorder = palette.crisisBorder;
  const warnBg = palette.warnSurface;
  const attendanceNote = attendanceLabel(data.appointment);

  return (
    <Screen>
      <BetaBanner />
      <ConsentBanner context="diario" />
      <View style={styles.greet}>
        {data.photoUri ? (
          <Image
            source={{ uri: data.photoUri }}
            style={styles.avatar}
            accessibilityLabel="Foto de perfil"
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
            Mi Diario
          </Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>
            Hola {firstName} · {todayLabel()}
            {data.pathology ? ` · ${data.pathology}` : ''}
            {progress.streak >= 2 ? (
              <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>
                {' '}
                · Racha de {progress.streak} días
              </Text>
            ) : null}
          </Text>
        </View>
      </View>

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
            <Text
              style={[
                styles.badge,
                {
                  color: palette.textWarning,
                  backgroundColor: mode === 'dark' ? palette.badgePendingBgDark : palette.badgePendingBg,
                },
              ]}
            >
              Por confirmar
            </Text>
          ) : null}
          {attendanceNote ? (
            <Text style={{ color: palette.textPrimary, fontWeight: '800', marginTop: 10 }}>{attendanceNote}</Text>
          ) : !data.appointment.attendance ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button
                label="Confirmo asistencia"
                testID="appointment-confirm"
                disabled={isSubmittingAppointmentAttendance}
                onPress={() => submitAppointmentAttendance({ attendance: 'confirmada' })}
              />
              <TextInput
                value={rescheduleReason}
                onChangeText={setRescheduleReason}
                placeholder="Motivo opcional si necesitas reprogramar"
                placeholderTextColor={palette.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 12,
                  padding: 12,
                  color: palette.text,
                  backgroundColor: palette.surface,
                  minHeight: 48,
                }}
              />
              <Button
                label="Necesito reprogramar"
                variant="ghost"
                testID="appointment-reschedule"
                disabled={isSubmittingAppointmentAttendance}
                onPress={() =>
                  submitAppointmentAttendance({
                    attendance: 'reprogramar',
                    rescheduleReason,
                  })
                }
              />
            </View>
          ) : null}
          <PreConsultBlock
            appointment={data.appointment}
            nowMs={new Date(today).getTime()}
            submitting={isSubmittingPreConsult}
            onSubmit={submitPreConsult}
          />
        </Card>
      ) : null}

      {instructions.current?.text.trim() ? (
        <Card
          testID="instruction-card"
          style={[styles.block, { backgroundColor: palette.accentSoft, borderColor: palette.instructionBorder }]}
        >
          <Text
            accessibilityRole="header"
            accessibilityLabel="Instrucción de tu equipo"
            style={[styles.kicker, { color: palette.textAccent }]}
          >
            INSTRUCCIÓN DE TU EQUIPO
          </Text>
          <Text
            accessibilityRole="text"
            accessibilityLabel={data.instruction.text}
            style={[styles.cardTitle, { color: palette.text }]}
          >
            {instructions.current.text}
          </Text>
          {instructionRead ? (
            <Text
              testID="instruction-read"
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
              style={{ color: palette.textPrimary, fontWeight: '800', fontSize: 13, marginTop: 10 }}
            >
              {formatInstructionRead(instructionRead)}
            </Text>
          ) : (
            <View style={{ marginTop: 12 }}>
              <Button
                label="Entendido"
                accessibilityLabel="Entendido, instrucción de tu equipo"
                onPress={acknowledgeInstruction}
                disabled={isAcknowledgingInstruction}
                testID="instruction-ack"
              />
            </View>
          )}
        </Card>
      ) : null}
      {instructions.previous.length > 0 ? (
        <Card testID="instruction-history" style={styles.block}>
          <Text style={[styles.kicker, { color: palette.textMuted }]}>INSTRUCCIONES ANTERIORES</Text>
          {instructions.previous.map((row) => (
            <View key={row.id} style={{ marginTop: 10 }}>
              <Text style={{ color: palette.textMuted, fontSize: 12, fontWeight: '800' }}>
                {formatInstructionDate(row.date)}
              </Text>
              <Text style={{ color: palette.text, marginTop: 4, lineHeight: 20 }}>{row.text}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {todayRecords.length > 0 ? (
        <Card style={styles.block}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Registros de hoy</Text>
          {todayRecords.map((r) => {
            const mood = moodLabel(r.mood);
            const secondary = checkInSecondaryLine(r);
            return (
              <View key={r.id} style={[styles.row, { backgroundColor: palette.surfaceMuted }]}>
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
                    {r.time} · {r.zones.join(' · ') || 'Sin zonas'}
                  </Text>
                  <Text style={{ color: palette.textMuted, fontSize: 13 }}>
                    {[mood && `Ánimo: ${mood}`, r.sleep && `Sueño: ${r.sleep}`]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </Text>
                  {secondary ? (
                    <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 4 }}>{secondary}</Text>
                  ) : null}
                  {!isSharedWithTeam(r) ? (
                    <Text
                      style={{ color: palette.textMuted, fontSize: 12, fontWeight: '800', marginTop: 4 }}
                      testID={`checkin-not-shared-${r.id}`}
                    >
                      No compartido con tu equipo
                    </Text>
                  ) : null}
                  {r.syncStatus === 'pending' ? (
                    <Text
                      style={{ color: palette.textMuted, fontSize: 12, fontWeight: '800', marginTop: 4 }}
                      testID={`checkin-pending-${r.id}`}
                    >
                      pendiente de envío
                    </Text>
                  ) : null}
                  {r.quick ? (
                    <Text
                      style={{ color: palette.textMuted, fontSize: 12, fontWeight: '800', marginTop: 4 }}
                      testID={`checkin-quick-${r.id}`}
                    >
                      Registro rápido
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
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
      <View style={{ height: 10 }} />
      <Button
        label="Registro rápido"
        variant="ghost"
        onPress={() => navigation.navigate('QuickCheckin')}
        accessibilityHint="Abre el check-in de un día difícil"
        testID="diario-quick-checkin"
      />

      <Card style={styles.block}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.cardTitle, { color: palette.text, marginTop: 0 }]}>Mi progreso</Text>
          <Button label="Ver todo →" variant="ghost" onPress={() => navigation.navigate('Progreso')} />
        </View>
        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: palette.surfaceMuted }]}>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>{progress.streak}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>días de racha</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: palette.surfaceMuted }]}>
            <Text style={[styles.statValue, { color: palette.textWarning }]}>{progress.painAvg7}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>dolor prom. 7d</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: palette.surfaceMuted }]}>
            <Text style={[styles.statValue, { color: palette.text }]}>{progress.total}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>registros</Text>
          </View>
        </View>
        <PainChart values={progress.series} gridColor={palette.border} labelColor={palette.textMuted} />
      </Card>

      <Card style={styles.block}>
        <Text style={[styles.cardTitle, { color: palette.text, marginTop: 0 }]}>Orientación y apoyo</Text>
        <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 10, lineHeight: 18 }}>
          Sugerido según tu patología · solo fuentes confiables.
        </Text>
        {guides.map((guide) => (
          <Pressable
            key={guide.title}
            accessibilityRole="link"
            accessibilityHint="Abre en el navegador del sistema"
            onPress={() => Linking.openURL(guide.href).catch(() => {})}
            style={({ pressed }) => [
              styles.guideRow,
              { borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <IconTile name="book" color={palette.accent} background={palette.accentSoft} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '800' }}>{guide.title}</Text>
              <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                {guide.desc}
              </Text>
              <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: 12, marginTop: 6 }}>
                {guide.src} ↗
              </Text>
            </View>
          </Pressable>
        ))}
      </Card>

      <Card testID="relief-help-card" style={styles.block}>
        <Text style={[styles.cardTitle, { color: palette.text, marginTop: 0 }]}>
          Lo que te ha ayudado
        </Text>
        <Text style={[styles.helpNote, { color: palette.text }]}>
          Según lo que registraste. No es una recomendación ni indica una causa.
        </Text>
        {helped.length === 0 ? (
          <Text testID="relief-help-empty" style={[styles.helpEmpty, { color: palette.text }]}>
            Aún no registras acciones de alivio.
          </Text>
        ) : (
          helped.map((item, index) => (
            <View
              key={item.id}
              accessible
              accessibilityLabel={`${item.copy}. ${reliefHelpDetail(item)}`}
              testID={`relief-help-${item.id.replace(/[^a-zA-Z0-9]+/g, '-')}`}
              style={[
                styles.helpRow,
                index > 0 ? { borderTopWidth: 1, borderTopColor: palette.border } : null,
              ]}
            >
              <Text style={[styles.helpCopy, { color: palette.text }]}>{item.copy}</Text>
              <Text style={[styles.helpMeta, { color: palette.textMuted }]}>{reliefHelpDetail(item)}</Text>
            </View>
          ))
        )}
      </Card>

      <View style={[styles.crisis, { backgroundColor: crisisBg, borderColor: crisisBorder }]}>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('AlivIA' as never)}
          accessibilityRole="button"
          accessibilityLabel="Dolor muy fuerte o inusual. Ir a AlivIA"
          style={({ pressed }) => [styles.crisisNav, { opacity: pressed ? 0.85 : 1 }]}
        >
          <IconTile name="warn" color={palette.danger} background={warnBg} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.text, fontWeight: '800' }}>¿Dolor muy fuerte o inusual?</Text>
            <Text style={{ color: palette.textMuted, marginTop: 2 }}>Habla con AlivIA o tu equipo</Text>
          </View>
        </Pressable>
        <Pressable
          testID="diario-call-131"
          accessibilityRole="link"
          accessibilityLabel="Llamar al 131"
          accessibilityHint="Abre el marcador"
          onPress={() => openDialer(EMERGENCY_TEL)}
          style={({ pressed }) => [
            styles.crisisCall,
            { borderColor: palette.danger, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={{ color: palette.textDanger, fontWeight: '800', fontSize: 16 }}>
            Llamar al {EMERGENCY_TEL}
          </Text>
        </Pressable>
        {centerPhone ? (
          <Pressable
            testID="diario-call-center"
            accessibilityRole="link"
            accessibilityLabel={`Llamar al centro, ${centerPhone}`}
            accessibilityHint="Abre el marcador"
            onPress={() => openDialer(centerPhone)}
            style={({ pressed }) => [
              styles.crisisCall,
              { borderColor: palette.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={{ color: palette.text, fontWeight: '700', fontSize: 15 }}>
              Llamar al centro · {centerPhone}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greet: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatar: { width: 48, height: 48, borderRadius: 16 },
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  sub: { fontSize: 14, marginTop: 6, lineHeight: 20 },
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
  painNum: { fontWeight: '800', fontSize: 15 },
  prompt: { borderRadius: 20, padding: 22, marginBottom: 14 },
  promptTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  promptBody: { color: 'rgba(255,255,255,0.88)', marginTop: 6, lineHeight: 20, fontSize: 13 },
  guideRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  helpNote: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  helpEmpty: { fontSize: 16, lineHeight: 22, marginTop: 10 },
  helpRow: { paddingVertical: 12 },
  helpCopy: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  helpMeta: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  crisis: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  crisisNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
  },
  crisisCall: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
});
