import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type OptionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Lo que anuncia el lector de pantalla cuando "Sí" o "No" solos serían ambiguos. */
  accessibilityLabel?: string;
  testID?: string;
};

/** Chip de opción de 48 dp, con la misma apariencia que `Chip`. */
export function OptionChip({ label, selected, onPress, accessibilityLabel, testID }: OptionChipProps) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? palette.primarySoft : palette.surface,
          borderColor: selected ? palette.primary : palette.border,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 15,
          color: selected ? palette.primary : palette.text,
          fontWeight: selected ? '700' : '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type YesNoProps = {
  /** Pregunta; también es el nombre accesible de cada opción ("Pregunta: Sí"). */
  question: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function YesNo({ question, value, onChange }: YesNoProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.yesNo}>
      <Text style={[styles.question, { color: palette.text }]}>{question}</Text>
      <View style={styles.row}>
        <OptionChip
          label="Sí"
          selected={value}
          onPress={() => onChange(true)}
          accessibilityLabel={`${question} Sí`}
        />
        <OptionChip
          label="No"
          selected={!value}
          onPress={() => onChange(false)}
          accessibilityLabel={`${question} No`}
        />
      </View>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numeric?: boolean;
  maxLength?: number;
  hint?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  testID?: string;
};

/** Campo con etiqueta visible (nunca placeholder como único label), una línea o varias. */
export function Field({
  label,
  value,
  onChangeText,
  multiline,
  numeric,
  maxLength,
  hint,
  autoCapitalize = 'sentences',
  testID,
}: FieldProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      {hint ? <Text style={[styles.hint, { color: palette.textMuted }]}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        allowFontScaling
        testID={testID}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={numeric ? 'number-pad' : 'default'}
        inputMode={numeric ? 'numeric' : undefined}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          multiline && styles.multiline,
          { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      />
    </View>
  );
}

type NoteProps = {
  /** Nombre de la sección, para el lector de pantalla ("zonas", "ánimo", "sueño"). */
  section: string;
  prompt: string;
  value: string;
  onChangeText: (text: string) => void;
  testID?: string;
};

/** "Tengo algo más que agregar": texto libre opcional por sección. */
export function NoteToggle({ section, prompt, value, onChangeText, testID }: NoteProps) {
  const { palette } = useTheme();
  const [open, setOpen] = useState(value.trim().length > 0);
  return (
    <View style={styles.note}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${open ? 'Ocultar' : 'Agregar'} detalle de ${section}`}
        style={styles.noteToggle}
        testID={testID ? `${testID}-toggle` : undefined}
      >
        <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 14 }}>
          {open ? 'Ocultar detalle' : 'Tengo algo más que agregar'}
        </Text>
      </Pressable>
      {open ? (
        <Field
          label={`Detalle de ${section} (opcional)`}
          hint={prompt}
          value={value}
          onChangeText={onChangeText}
          multiline
          testID={testID}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  yesNo: { marginBottom: 12 },
  question: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  field: { marginBottom: 14, gap: 4 },
  fieldLabel: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 96 },
  note: { marginTop: 8 },
  noteToggle: { minHeight: 48, justifyContent: 'center' },
});
