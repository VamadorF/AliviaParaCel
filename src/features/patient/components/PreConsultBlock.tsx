import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Field } from '@/features/patient/components/CheckinFields';
import type { Appointment, PgicValue, PreConsultInput } from '@/features/patient/types';
import {
  PGIC_OPTIONS,
  preConsultOf,
  preConsultParts,
  preConsultSlot,
} from '@/features/patient/utils/pre-consult';
import { Button } from '@/shared/components/Button';
import { useTheme } from '@/shared/theme/ThemeContext';

type PreConsultBlockProps = {
  appointment: Appointment;
  nowMs: number;
  submitting: boolean;
  onSubmit: (input: PreConsultInput) => void;
};

/** Formulario o respuestas de PAC-10, junto a la consulta. Fuera de las 48 h no pinta nada. */
export function PreConsultBlock({ appointment, nowMs, submitting, onSubmit }: PreConsultBlockProps) {
  const { palette } = useTheme();
  const slot = preConsultSlot(appointment, nowMs);
  const saved = preConsultOf(appointment);

  if (slot === 'answers' && saved) {
    return (
      <View
        testID="pre-consult-answers"
        style={[styles.block, { borderTopColor: palette.border }]}
      >
        <Text style={[styles.kicker, { color: palette.primary }]}>PREPARACIÓN ENVIADA</Text>
        {preConsultParts(saved).map((part) => (
          <Text key={part.label} style={[styles.answer, { color: palette.text }]}>
            <Text style={styles.answerLabel}>{part.label}: </Text>
            {part.value}
          </Text>
        ))}
      </View>
    );
  }

  if (slot !== 'form') return null;

  return (
    <PreConsultForm
      submitting={submitting}
      onSubmit={onSubmit}
    />
  );
}

function PreConsultForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (input: PreConsultInput) => void;
}) {
  const { palette } = useTheme();
  const [topics, setTopics] = useState('');
  const [pgic, setPgic] = useState<PgicValue | null>(null);
  const [goal, setGoal] = useState('');
  const ready = topics.trim().length > 0 && pgic != null && goal.trim().length > 0;

  return (
    <View testID="pre-consult-form" style={[styles.block, { borderTopColor: palette.border }]}>
      <Text style={[styles.title, { color: palette.text }]}>Preparación de la consulta</Text>
      <Text style={[styles.help, { color: palette.textMuted }]}>
        Se responde una vez por consulta, cuando faltan 48 horas o menos.
      </Text>
      <Field
        label="¿Qué quieres tratar?"
        value={topics}
        onChangeText={setTopics}
        multiline
        testID="pre-consult-topics"
      />
      <View accessibilityRole="radiogroup" style={styles.group}>
        <Text style={[styles.legend, { color: palette.text }]}>
          Desde la consulta anterior, ¿cómo ha cambiado tu estado en general?
        </Text>
        {PGIC_OPTIONS.map((option) => {
          const selected = pgic === option.value;
          return (
            <Pressable
              key={option.value}
              testID={`pre-consult-pgic-${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => setPgic(option.value)}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? palette.primarySoft : palette.surface,
                  borderColor: selected ? palette.primary : palette.border,
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { borderColor: selected ? palette.primary : palette.textMuted },
                ]}
              >
                {selected ? (
                  <View style={[styles.dotFill, { backgroundColor: palette.primary }]} />
                ) : null}
              </View>
              <Text
                style={{
                  color: selected ? palette.primary : palette.text,
                  fontWeight: selected ? '700' : '600',
                  fontSize: 15,
                  flex: 1,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Field
        label="¿Qué te gustaría poder hacer?"
        value={goal}
        onChangeText={setGoal}
        testID="pre-consult-goal"
      />
      <Button
        label="Enviar preparación"
        testID="pre-consult-submit"
        disabled={!ready}
        loading={submitting}
        onPress={() => {
          if (!ready || submitting || pgic == null) return;
          onSubmit({
            topics: topics.trim(),
            pgic,
            functionalGoal: goal.trim(),
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  title: { fontSize: 16, fontWeight: '800' },
  help: { fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 12 },
  answer: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  answerLabel: { fontWeight: '800' },
  group: { marginBottom: 8 },
  legend: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  option: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFill: { width: 10, height: 10, borderRadius: 5 },
});
