import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useReminders } from '@/features/patient/notifications/ReminderProvider';
import {
  decideAppointment,
  formatClock,
  isQuietClock,
  medicationChoice,
  parseClock,
  type Clock,
  type ReminderSettings,
} from '@/features/patient/notifications/reminders';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { activeMedications } from '@/features/patient/utils/medications';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { useTheme } from '@/shared/theme/ThemeContext';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ClockField({
  label,
  value,
  onCommit,
  testID,
}: {
  label: string;
  value: Clock;
  onCommit: (clock: Clock) => void;
  testID?: string;
}) {
  const { palette } = useTheme();
  const [text, setText] = useState(formatClock(value));
  const [invalid, setInvalid] = useState(false);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(formatClock(value));
  }, [value.hour, value.minute]);

  const commit = () => {
    const parsed = parseClock(text);
    if (!parsed) {
      setInvalid(true);
      setText(formatClock(value));
      return;
    }
    setInvalid(false);
    if (parsed.hour !== value.hour || parsed.minute !== value.minute) onCommit(parsed);
  };

  return (
    <View style={styles.clock}>
      <Text style={[styles.clockLabel, { color: palette.textMuted }]}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={(next) => {
          setInvalid(false);
          setText(next);
        }}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          commit();
        }}
        onSubmitEditing={commit}
        accessibilityLabel={label}
        accessibilityHint="Hora en formato 24 horas, por ejemplo 09:00"
        allowFontScaling
        keyboardType="default"
        maxLength={5}
        testID={testID}
        placeholder="09:00"
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          { color: palette.text, borderColor: palette.border, backgroundColor: palette.surface },
        ]}
      />
      {invalid ? (
        <Text style={{ color: palette.danger, marginTop: 6 }} accessibilityLiveRegion="polite">
          Usa una hora como 09:00.
        </Text>
      ) : null}
    </View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  testID,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>{label}</Text>
        {hint ? (
          <Text style={{ color: palette.textMuted, marginTop: 4, lineHeight: 20 }}>{hint}</Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        testID={testID}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        trackColor={{ false: palette.border, true: palette.primary }}
        thumbColor={palette.surface}
      />
    </View>
  );
}

export function RemindersScreen() {
  const { palette } = useTheme();
  const { data } = usePatientSession();
  const { settings, ready, permission, update, ensurePermission } = useReminders();
  const [saved, setSaved] = useState<string | null>(null);
  const asked = useRef(false);
  const meds = activeMedications(data.medications);
  const appointment = decideAppointment(
    settings.appointmentEnabled,
    data.appointment,
    settings.quiet,
    new Date(),
  );

  useEffect(() => {
    if (!ready || asked.current) return;
    asked.current = true;
    ensurePermission();
  }, [ready, ensurePermission]);

  const commit = (next: ReminderSettings) => {
    update(next, true);
    setSaved('Recordatorios actualizados.');
  };

  const permissionNote =
    permission === 'denied'
      ? 'Sin permiso de avisos en el teléfono. Actívalo en los ajustes del sistema: esta configuración queda guardada.'
      : permission === 'unavailable'
        ? 'En este dispositivo los avisos no se programan. La configuración queda guardada.'
        : null;

  let appointmentHint: string | null = null;
  if (settings.appointmentEnabled) {
    if (appointment.status === 'missing') {
      appointmentHint = 'No tienes una consulta agendada. Si aparece una, el aviso queda listo.';
    } else if (appointment.status === 'invalid') {
      appointmentHint = 'No se pudo leer la fecha de la consulta.';
    } else if (appointment.status === 'passed') {
      appointmentHint = 'El aviso de 24 horas ya pasó.';
    } else if (appointment.status === 'silenced') {
      appointmentHint = 'Esas 24 horas caen en el horario silencioso, así que no sonará.';
    } else if (appointment.status === 'scheduled') {
      appointmentHint = `Suena el ${formatWhen(appointment.at)}.`;
    }
  }

  return (
    <Screen>
      <Text style={[styles.intro, { color: palette.textMuted }]}>
        Estos avisos se programan en el teléfono. No necesitan internet ni un servidor.
      </Text>
      {permissionNote ? (
        <Text accessibilityLiveRegion="polite" style={{ color: palette.text, lineHeight: 21, marginBottom: 12 }}>
          {permissionNote}
        </Text>
      ) : null}
      {saved ? (
        <Text accessibilityLiveRegion="polite" style={{ color: palette.primary, fontWeight: '700', marginBottom: 12 }}>
          {saved}
        </Text>
      ) : null}

      <Card>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>REGISTRO DIARIO</Text>
        <ToggleRow
          label="Avisarme cada día"
          value={settings.dailyEnabled}
          onValueChange={(dailyEnabled) => commit({ ...settings, dailyEnabled })}
          testID="reminders-daily"
        />
        {settings.dailyEnabled ? (
          <>
            <ClockField
              label="Hora"
              value={settings.dailyTime}
              onCommit={(dailyTime) => commit({ ...settings, dailyTime })}
              testID="reminders-daily-time"
            />
            {isQuietClock(settings.dailyTime, settings.quiet) ? (
              <Text style={[styles.note, { color: palette.text }]}>
                Esa hora está en el horario silencioso, así que no sonará.
              </Text>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>MEDICAMENTOS</Text>
        <Text style={[styles.note, { color: palette.textMuted }]}>
          Opcional: un aviso por cada medicamento activo.
        </Text>
        {meds.length === 0 ? (
          <Text style={{ color: palette.text, lineHeight: 21 }}>No tienes medicamentos activos.</Text>
        ) : (
          meds.map((med) => {
            const choice = medicationChoice(settings, med.id);
            return (
              <View key={med.id} style={styles.med}>
                <ToggleRow
                  label={med.name}
                  hint={med.frequency}
                  value={choice.enabled}
                  testID={`reminders-med-${med.id}`}
                  onValueChange={(enabled) =>
                    commit({
                      ...settings,
                      medications: {
                        ...settings.medications,
                        [med.id]: { ...choice, enabled },
                      },
                    })
                  }
                />
                {choice.enabled ? (
                  <>
                    <ClockField
                      label={`Hora de ${med.name}`}
                      value={choice.time}
                      testID={`reminders-med-time-${med.id}`}
                      onCommit={(time) =>
                        commit({
                          ...settings,
                          medications: {
                            ...settings.medications,
                            [med.id]: { ...choice, time },
                          },
                        })
                      }
                    />
                    {isQuietClock(choice.time, settings.quiet) ? (
                      <Text style={[styles.note, { color: palette.text }]}>
                        Esa hora está en el horario silencioso, así que no sonará.
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })
        )}
      </Card>

      <Card>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>CONSULTA</Text>
        <ToggleRow
          label="Avisarme 24 horas antes"
          value={settings.appointmentEnabled}
          onValueChange={(appointmentEnabled) => commit({ ...settings, appointmentEnabled })}
          testID="reminders-appointment"
        />
        {appointmentHint ? (
          <Text style={[styles.note, { color: palette.text }]}>{appointmentHint}</Text>
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>HORARIO SILENCIOSO</Text>
        <ToggleRow
          label="Silenciar avisos"
          hint="Entre estas horas no suena ningún aviso."
          value={settings.quiet.enabled}
          onValueChange={(enabled) => commit({ ...settings, quiet: { ...settings.quiet, enabled } })}
          testID="reminders-quiet"
        />
        {settings.quiet.enabled ? (
          <View style={styles.quietTimes}>
            <ClockField
              label="Desde"
              value={settings.quiet.start}
              onCommit={(start) => commit({ ...settings, quiet: { ...settings.quiet, start } })}
              testID="reminders-quiet-start"
            />
            <ClockField
              label="Hasta"
              value={settings.quiet.end}
              onCommit={(end) => commit({ ...settings, quiet: { ...settings.quiet, end } })}
              testID="reminders-quiet-end"
            />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 16, lineHeight: 22, marginBottom: 12 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 10 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  note: { lineHeight: 21, marginBottom: 8 },
  clock: { marginTop: 4, marginBottom: 8 },
  clockLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  med: { marginTop: 8 },
  quietTimes: { marginTop: 4 },
});
