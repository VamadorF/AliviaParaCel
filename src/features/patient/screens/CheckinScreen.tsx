import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/shared/components/Button';
import { Chip } from '@/shared/components/Chip';
import { IconTile } from '@/shared/icons/AppIcon';
import { EVA_FACES, PainFace } from '@/shared/icons/PainFace';
import { DOSE_REASON_LABEL, DOSE_TAKEN_LABEL, allowedReasons, doseNeedsReason } from '@/shared/core/checkin-dose';
import type { DoseReasonKind } from '@/shared/core/checkin-dose';
import { AI_NOTICE_TEXT } from '@/shared/data/ai-notice';
import { Field, NoteToggle, OptionChip, YesNo } from '@/features/patient/components/CheckinFields';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import {
  APPETITE_LABEL,
  STEP,
  TAKEN_OPTIONS,
  allMissing,
  attributionSummaryOf,
  buildCheckInRecord,
  giSummary,
  initialDraft,
  lastCaregiverOf,
  nextStep,
  patchDose,
  patchRelief,
  prevStep,
  sanitizeBowel,
  stepFlow,
  stepMissing,
  toggleRelief,
  toggleTrigger,
} from '@/features/patient/utils/checkin';
import {
  attributionContext,
  reliefOptions,
  showReliefTriggerSteps,
  triggerOptions,
} from '@/features/patient/utils/checkin-steps';
import { OTHER_ID, RELIEF_LEVELS, RELIEF_LEVEL_LABEL, reliefLabel } from '@/shared/data/trigger-catalog';
import type { Appetite, CheckinDraft } from '@/features/patient/utils/checkin';
import { activeMedications, medicationDetail, medicationTitle } from '@/features/patient/utils/medications';
import { painColor, painLabel } from '@/features/patient/utils/pain';
import { useTheme } from '@/shared/theme/ThemeContext';

const ZONES = ['Cabeza', 'Cuello', 'Hombro', 'Lumbar', 'Cadera', 'Rodilla', 'Otro'];
const MOODS = ['Bien', 'Regular', 'Cansada', 'Ansiosa'];
const SLEEP = ['< 5 h', '5–6 h', '6–7 h', '7+ h'];
const APPETITES: Appetite[] = ['normal', 'reducido', 'nulo'];

export function CheckinScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { data, saveCheckIn } = usePatientSession();
  const medications = useMemo(() => activeMedications(data.medications), [data.medications]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CheckinDraft>(() =>
    initialDraft(medications, lastCaregiverOf(data.checkIns, user?.rut ?? '')),
  );

  const update = (patch: Partial<CheckinDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const blockers = useMemo(() => stepMissing(step, draft, medications), [step, draft, medications]);
  const isLast = step === STEP.resumen;

  // DIF-03: mismas reglas que la web (DIF-02). Los pasos opcionales nunca bloquean el guardado.
  const { previousPain, firstOfDay } = useMemo(
    () => attributionContext(data.checkIns, new Date()),
    [data.checkIns],
  );
  const showAttribution = showReliefTriggerSteps({ pain: draft.pain, previousPain, firstOfDay });
  const flow = stepFlow(showAttribution);
  const reliefOpts = useMemo(() => reliefOptions(), []);
  const triggerOpts = useMemo(() => triggerOptions(), []);

  const goNext = () => {
    if (blockers.length > 0) return;
    if (!isLast) setStep((s) => nextStep(s, showAttribution));
    else submit();
  };

  const skipAttribution = () => {
    if (step === STEP.alivios) update({ reliefSel: [] });
    else update({ triggerSel: [], triggerOther: '' });
    setStep((s) => nextStep(s, showAttribution));
  };

  const submit = () => {
    if (allMissing(draft, medications).length > 0) return;
    const now = new Date();
    const record = buildCheckInRecord(draft, medications, now, `local-${now.getTime()}`, showAttribution);
    if (!record) return;
    saveCheckIn(record);
    navigation.goBack();
  };

  const setDose = (medId: string, patch: Parameters<typeof patchDose>[1]) =>
    setDraft((d) => ({ ...d, doses: { ...d.doses, [medId]: patchDose(d.doses[medId], patch) } }));

  const summary = giSummary(draft);
  const attributionSummary = attributionSummaryOf(draft, showAttribution);
  const diffDoses = medications
    .map((m) => ({ m, d: draft.doses[m.id] }))
    .filter(({ d }) => d && doseNeedsReason(d.taken));

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
        Paso {flow.indexOf(step) + 1} de {flow.length}
      </Text>
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        Check-in diario
      </Text>
      <View style={[styles.notice, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}>
        <IconTile name="shield" color={palette.primary} background={palette.surface} size={32} iconSize={16} />
        <Text style={{ flex: 1, color: palette.text, fontSize: 13, lineHeight: 20 }} testID="checkin-ai-notice">
          {AI_NOTICE_TEXT}
        </Text>
      </View>

      {blockers.length > 0 ? (
        <Text
          style={{ color: palette.danger, marginBottom: 12 }}
          accessibilityLiveRegion="polite"
          testID="checkin-falta"
        >
          Falta: {blockers.join(', ')}
        </Text>
      ) : null}

      {step === STEP.urgencias ? (
        <View>
          <Text style={styles.label}>¿Necesitas urgencias ahora?</Text>
          <View style={styles.row}>
            <Chip
              label="No"
              selected={draft.emergency === false}
              onPress={() => update({ emergency: false, emergencyReason: '', emergencyDetail: '' })}
            />
            <Chip
              label="Sí"
              selected={draft.emergency === true}
              onPress={() => update({ emergency: true })}
            />
          </View>
          {draft.emergency ? (
            <View>
              <Field
                label="Motivo (obligatorio)"
                value={draft.emergencyReason}
                onChangeText={(t) => update({ emergencyReason: t })}
                testID="checkin-er-reason"
              />
              <Field
                label="¿Qué pasó? (obligatorio)"
                value={draft.emergencyDetail}
                onChangeText={(t) => update({ emergencyDetail: t })}
                multiline
                testID="checkin-er-detail"
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {step === STEP.quien ? (
        <View>
          <Text style={styles.label}>¿Quién registra?</Text>
          <View style={styles.row}>
            <Chip
              label="Yo"
              selected={draft.registrant === 'self'}
              onPress={() => update({ registrant: 'self' })}
            />
            <Chip
              label="Soy cuidador"
              selected={draft.registrant === 'caregiver'}
              onPress={() => update({ registrant: 'caregiver' })}
            />
          </View>
          {draft.registrant === 'caregiver' ? (
            <View>
              <Field
                label="Nombre del cuidador (obligatorio)"
                value={draft.caregiverName}
                onChangeText={(t) => update({ caregiverName: t })}
                autoCapitalize="words"
                testID="checkin-caregiver-name"
              />
              <Field
                label="Relación con el paciente (obligatorio)"
                value={draft.caregiverRelation}
                onChangeText={(t) => update({ caregiverRelation: t })}
                hint="Por ejemplo: hija, esposo, enfermera."
                testID="checkin-caregiver-relation"
              />
              <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 19 }}>
                Los datos del cuidador se tratan conforme a la Ley 19.628 y la Ley 21.719 sobre protección de datos personales.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === STEP.dolor ? (
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
                  onPress={() => update({ pain: face.num })}
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
                onPress={() => update({ pain: n })}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === STEP.zonas ? (
        <View>
          <Text style={styles.label}>Zonas con dolor</Text>
          <View style={styles.rowWrap}>
            {ZONES.map((z) => (
              <Chip
                key={z}
                label={z}
                selected={draft.zones.includes(z)}
                onPress={() =>
                  update({
                    zones: draft.zones.includes(z)
                      ? draft.zones.filter((x) => x !== z)
                      : [...draft.zones, z],
                  })
                }
              />
            ))}
          </View>
          <NoteToggle
            section="zonas"
            prompt="Cuéntanos más: cómo es el dolor (punzante, quemante…), cuándo empezó, qué lo alivia o empeora."
            value={draft.notes.zones}
            onChangeText={(t) => update({ notes: { ...draft.notes, zones: t } })}
            testID="checkin-note-zones"
          />
        </View>
      ) : null}

      {step === STEP.animo ? (
        <View>
          <Text style={styles.label}>Ánimo</Text>
          <View style={styles.rowWrap}>
            {MOODS.map((m) => (
              <Chip
                key={m}
                label={m}
                selected={draft.mood === m}
                onPress={() => update({ mood: m })}
              />
            ))}
          </View>
          <NoteToggle
            section="ánimo"
            prompt="¿Qué ha influido en tu ánimo hoy? Preocupaciones, buenas noticias, energía…"
            value={draft.notes.mood}
            onChangeText={(t) => update({ notes: { ...draft.notes, mood: t } })}
            testID="checkin-note-mood"
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Sueño</Text>
          <View style={styles.rowWrap}>
            {SLEEP.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={draft.sleep === s}
                onPress={() => update({ sleep: s })}
              />
            ))}
          </View>
          <NoteToggle
            section="sueño"
            prompt="¿Despertares nocturnos, dificultad para conciliar el sueño, pesadillas, cuántas horas…?"
            value={draft.notes.sleep}
            onChangeText={(t) => update({ notes: { ...draft.notes, sleep: t } })}
            testID="checkin-note-sleep"
          />
        </View>
      ) : null}

      {step === STEP.medicamentos ? (
        <View>
          <View style={styles.medHead}>
            <IconTile name="pill" color={palette.primary} background={palette.primarySoft} size={36} iconSize={18} />
            <Text style={[styles.label, { marginBottom: 0, color: palette.text }]}>Medicamentos de hoy</Text>
          </View>
          {medications.length === 0 ? (
            <Text style={{ color: palette.textMuted, lineHeight: 22, marginBottom: 12 }}>
              Tu médico aún no registra medicamentos activos. Puedes continuar.
            </Text>
          ) : (
            medications.map((med) => {
              const dose = draft.doses[med.id];
              const title = medicationTitle(med);
              return (
                <View key={med.id} style={{ marginBottom: 16 }}>
                  <Text style={[styles.label, { color: palette.text, marginBottom: 2 }]}>{title}</Text>
                  <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>
                    {medicationDetail(med)}
                  </Text>
                  <View style={styles.rowWrap}>
                    {TAKEN_OPTIONS.map((key) => (
                      <OptionChip
                        key={key}
                        label={DOSE_TAKEN_LABEL[key]}
                        selected={dose.taken === key}
                        accessibilityLabel={`${title}: ${DOSE_TAKEN_LABEL[key]}`}
                        onPress={() => setDose(med.id, { taken: key })}
                      />
                    ))}
                  </View>
                  {doseNeedsReason(dose.taken) ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.sub, { color: palette.text }]}>Motivo (obligatorio)</Text>
                      <View style={styles.rowWrap}>
                        {allowedReasons(dose.taken).map((r) => (
                          <OptionChip
                            key={r}
                            label={DOSE_REASON_LABEL[r as Exclude<DoseReasonKind, ''>]}
                            selected={dose.reason === r}
                            accessibilityLabel={`${title}, motivo: ${DOSE_REASON_LABEL[r as Exclude<DoseReasonKind, ''>]}`}
                            onPress={() => setDose(med.id, { reason: r })}
                          />
                        ))}
                      </View>
                      {dose.reason === 'otro' ? (
                        <Field
                          label={`Describe el motivo (${title})`}
                          value={dose.reasonText}
                          onChangeText={(t) => setDose(med.id, { reasonText: t })}
                        />
                      ) : null}
                      <Field
                        label={`Cantidad tomada (opcional, ${title})`}
                        value={dose.amount}
                        onChangeText={(t) => setDose(med.id, { amount: t })}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
          <Field
            label="Consultar a mi equipo por un efecto adverso (opcional)"
            hint="Describe el síntoma o reacción."
            value={draft.adverseNote}
            onChangeText={(t) => update({ adverseNote: t })}
            multiline
            testID="checkin-adverse"
          />
        </View>
      ) : null}

      {step === STEP.digestivo ? (
        <View>
          <Text style={styles.label}>Otros signos de hoy</Text>
          <YesNo question="¿Has tenido náuseas?" value={draft.nausea} onChange={(v) => update({ nausea: v })} />
          <YesNo question="¿Has vomitado?" value={draft.vomiting} onChange={(v) => update({ vomiting: v })} />
          <Field
            label="Deposiciones hoy (opcional)"
            hint="Número de 0 a 99. Déjalo vacío si no quieres reportarlo."
            value={draft.bowel}
            onChangeText={(t) => update({ bowel: sanitizeBowel(t) })}
            numeric
            maxLength={2}
            testID="checkin-bowel"
          />
          <Text style={styles.sub}>Apetito hoy</Text>
          <View style={[styles.rowWrap, { marginBottom: 12 }]}>
            {APPETITES.map((a) => (
              <OptionChip
                key={a}
                label={APPETITE_LABEL[a]}
                selected={draft.appetite === a}
                accessibilityLabel={`Apetito: ${APPETITE_LABEL[a]}`}
                onPress={() => update({ appetite: a })}
              />
            ))}
          </View>
          <YesNo question="¿Reflujo o acidez?" value={draft.reflux} onChange={(v) => update({ reflux: v })} />
        </View>
      ) : null}

      {step === STEP.alivios ? (
        <View testID="checkin-relief-step">
          <Text style={styles.label} accessibilityRole="header">
            ¿Hiciste algo para aliviarte?{' '}
            <Text style={{ fontSize: 13, fontWeight: '600', color: palette.textMuted }}>(opcional)</Text>
          </Text>
          <Text style={[styles.hint, { color: palette.textMuted }]}>
            Marca lo que hiciste y cuánto ayudó. Puedes omitirlo.
          </Text>
          <View style={styles.rowWrap}>
            {reliefOpts.map((o) => (
              <OptionChip
                key={o.id}
                label={o.suggested ? `${o.label} ★` : o.label}
                selected={draft.reliefSel.some((a) => a.action === o.id)}
                accessibilityLabel={o.suggested ? `${o.label}, sugerido` : o.label}
                onPress={() => update({ reliefSel: toggleRelief(draft.reliefSel, o.id) })}
              />
            ))}
          </View>
          {draft.reliefSel.map((a) => {
            const name = a.action === OTHER_ID ? 'Otro' : reliefLabel(a);
            return (
              <View key={a.action} style={[styles.reliefRow, { borderTopColor: palette.border }]}>
                <Text style={[styles.sub, { color: palette.text }]}>{name}: ¿cuánto alivió?</Text>
                {a.action === OTHER_ID ? (
                  <Field
                    label="¿Qué hiciste?"
                    value={a.text ?? ''}
                    onChangeText={(t) => update({ reliefSel: patchRelief(draft.reliefSel, a.action, { text: t }) })}
                    testID="checkin-relief-other"
                  />
                ) : null}
                <View style={styles.rowWrap}>
                  {RELIEF_LEVELS.map((l) => (
                    <OptionChip
                      key={l}
                      label={RELIEF_LEVEL_LABEL[l]}
                      selected={a.relief === l}
                      accessibilityLabel={`${name}: alivió ${RELIEF_LEVEL_LABEL[l].toLowerCase()}`}
                      onPress={() => update({ reliefSel: patchRelief(draft.reliefSel, a.action, { relief: l }) })}
                    />
                  ))}
                </View>
              </View>
            );
          })}
          <Button
            label="Omitir"
            variant="ghost"
            onPress={skipAttribution}
            accessibilityLabel="Omitir alivios"
            testID="checkin-relief-skip"
          />
        </View>
      ) : null}

      {step === STEP.gatillantes ? (
        <View testID="checkin-trigger-step">
          <Text style={styles.label} accessibilityRole="header">
            ¿Qué crees que lo gatilló?{' '}
            <Text style={{ fontSize: 13, fontWeight: '600', color: palette.textMuted }}>(opcional)</Text>
          </Text>
          <Text style={[styles.hint, { color: palette.textMuted }]}>Puedes marcar varios. Puedes omitirlo.</Text>
          <View style={styles.rowWrap}>
            {triggerOpts.map((o) => (
              <OptionChip
                key={o.id}
                label={o.suggested ? `${o.label} ★` : o.label}
                selected={draft.triggerSel.includes(o.id)}
                accessibilityLabel={o.suggested ? `${o.label}, sugerido` : o.label}
                onPress={() => update({ triggerSel: toggleTrigger(draft.triggerSel, o.id) })}
              />
            ))}
          </View>
          {draft.triggerSel.includes(OTHER_ID) ? (
            <Field
              label="Describe el gatillante"
              value={draft.triggerOther}
              onChangeText={(t) => update({ triggerOther: t })}
              testID="checkin-trigger-other"
            />
          ) : null}
          <Button
            label="Omitir"
            variant="ghost"
            onPress={skipAttribution}
            accessibilityLabel="Omitir gatillantes"
            testID="checkin-trigger-skip"
          />
        </View>
      ) : null}

      {isLast ? (
        <View style={styles.faceHero}>
          <PainFace value={draft.pain} size={64} />
          <Text style={{ color: palette.text, lineHeight: 24, textAlign: 'center' }}>
            Dolor {draft.pain.toFixed(1)} ({painLabel(draft.pain)}). Zonas:{' '}
            {draft.zones.join(', ') || '—'}.
            {draft.emergency ? ' Incluye urgencias.' : ''}
          </Text>
          {draft.registrant === 'caregiver' ? (
            <Text style={[styles.summary, { color: palette.text }]}>
              Registra {draft.caregiverName.trim()} ({draft.caregiverRelation.trim()}).
            </Text>
          ) : null}
          {diffDoses.length > 0 ? (
            <Text style={[styles.summary, { color: palette.text }]}>
              Dosis distintas de lo indicado:{' '}
              {diffDoses.map(({ m, d }) => `${medicationTitle(m)} (${DOSE_TAKEN_LABEL[d.taken]})`).join(', ')}.
            </Text>
          ) : null}
          {summary ? (
            <Text style={[styles.summary, { color: palette.text }]}>Signos digestivos: {summary}.</Text>
          ) : null}
          {draft.adverseNote.trim() ? (
            <Text style={[styles.summary, { color: palette.text }]}>
              Incluye una consulta por efecto adverso.
            </Text>
          ) : null}
          {attributionSummary ? (
            <Text style={[styles.summary, { color: palette.text }]}>{attributionSummary}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button label="Atrás" variant="ghost" onPress={() => setStep((s) => prevStep(s, showAttribution))} />
        ) : (
          <Button label="Cerrar" variant="ghost" onPress={() => navigation.goBack()} />
        )}
        <View style={{ height: 10 }} />
        <Button
          label={isLast ? 'Guardar registro' : 'Siguiente'}
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
  sub: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  reliefRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 4, marginBottom: 8 },
  summary: { lineHeight: 22, textAlign: 'center', marginTop: 4 },
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
