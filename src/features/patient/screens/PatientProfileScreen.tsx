import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { ConsentCard } from '@/features/patient/components/ConsentCard';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import {
  useDecideLinkRequestMutation,
  useRequestAccountDeletionMutation,
  useResetDemoDataMutation,
  useSetPhotoMutation,
  useUpdateContactMutation,
} from '@/features/patient/hooks/usePatientBootstrap';
import { shareRecordFile } from '@/features/patient/profile/share-record';
import type { LinkRequest } from '@/features/patient/types';
import { activeMedications, medicationDetail, medicationTitle } from '@/features/patient/utils/medications';
import {
  ACCOUNT_RETENTION_NOTE,
  applyContact,
  buildRecordFile,
  DELETE_ACCOUNT_INTRO,
  DELETE_ACCOUNT_RECORD,
  DELETE_ACCOUNT_RECORD_REST,
  DELETE_ACCOUNT_RECORD_STRONG,
  DELETE_ACCOUNT_RETURN,
  DELETE_ACCOUNT_TITLE,
  teamExpiryText,
  teamMemberLine,
} from '@/features/patient/utils/profile';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { formatRut } from '@/shared/data/rut';
import { IconTile } from '@/shared/icons/AppIcon';
import type { PerfilStackParamList } from '@/shared/types/navigation';
import { useTheme } from '@/shared/theme/ThemeContext';

function roleLabel(role: LinkRequest['requesterRole']): string {
  return role === 'organizacion' ? 'Organización' : 'Médico';
}

export function PatientProfileScreen() {
  const { palette, mode, toggleMode } = useTheme();
  const { user, signOut } = useAuth();
  const { data } = usePatientSession();
  const resetDemo = useResetDemoDataMutation();
  const decideLink = useDecideLinkRequestMutation();
  const updateContact = useUpdateContactMutation();
  const setPhoto = useSetPhotoMutation();
  const deleteAccount = useRequestAccountDeletionMutation();
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const sourceEmail = data.email ?? '';
  const sourcePhone = data.phone ?? '';
  const [draft, setDraft] = useState<{
    email: string;
    phone: string;
    sourceEmail: string;
    sourcePhone: string;
  } | null>(null);
  const editing =
    draft != null && draft.sourceEmail === sourceEmail && draft.sourcePhone === sourcePhone;
  const email = editing ? draft.email : sourceEmail;
  const phone = editing ? draft.phone : sourcePhone;
  const navigation = useNavigation<NativeStackNavigationProp<PerfilStackParamList>>();

  const team = data.team ?? [];
  const requests = data.linkRequests ?? [];
  const meds = activeMedications(data.medications);
  const hint = { color: palette.textMuted, fontSize: 12, lineHeight: 18, marginTop: -8, marginBottom: 12 };

  const onResetDemo = () => {
    resetDemo.mutate(undefined, {
      onSuccess: () => {
        setResetMessage('Datos de demostración restablecidos');
      },
    });
  };

  const onPickPhoto = async () => {
    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice({ text: 'Necesitamos permiso para elegir una foto de tu galería.', error: true });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setPhoto.mutate(result.assets[0].uri, {
      onSuccess: () => setNotice({ text: 'Foto de perfil actualizada', error: false }),
    });
  };

  const onSaveContact = () => {
    const result = applyContact(data, email, phone);
    if (!result.ok) {
      setNotice({ text: result.error, error: true });
      return;
    }
    updateContact.mutate(
      { email: result.next.email ?? '', phone: result.next.phone ?? '' },
      { onSuccess: () => setNotice({ text: 'Datos de contacto actualizados', error: false }) },
    );
  };

  const onDownload = async () => {
    try {
      const json = buildRecordFile({
        name: user?.name ?? '',
        rut: user ? formatRut(user.rut) : '',
        data,
      });
      await shareRecordFile(json);
      setNotice({ text: 'Ficha lista para compartir desde este teléfono', error: false });
    } catch {
      setNotice({ text: 'No se pudo compartir la ficha', error: true });
    }
  };

  const onDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        signOut();
      },
    });
  };

  return (
    <Screen>
      <BetaBanner />
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        Perfil
      </Text>
      {notice ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: notice.error ? palette.textDanger : palette.textPrimary,
            fontWeight: '600',
            marginBottom: 8,
            lineHeight: 21,
          }}
        >
          {notice.text}
        </Text>
      ) : null}
      <Card>
        <View style={styles.identity}>
          {data.photoUri ? (
            <Image
              source={{ uri: data.photoUri }}
              style={styles.photo}
              accessibilityLabel="Foto de perfil"
            />
          ) : (
            <IconTile name="person" color={palette.primary} background={palette.primarySoft} size={56} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 18, color: palette.text }}>{user?.name}</Text>
            <Text style={{ color: palette.textMuted, marginTop: 6 }}>
              RUT {user ? formatRut(user.rut) : '—'}
            </Text>
            {data.pathology ? (
              <Text style={{ color: palette.text, marginTop: 6, lineHeight: 21 }}>
                Patología: {data.pathology}
              </Text>
            ) : (
              <Text style={{ color: palette.textMuted, marginTop: 6, lineHeight: 21 }}>
                Sin patología registrada
              </Text>
            )}
          </View>
        </View>
        <View style={{ height: 12 }} />
        <Button
          label={data.photoUri ? 'Cambiar foto' : 'Elegir foto'}
          variant="ghost"
          onPress={onPickPhoto}
          disabled={setPhoto.isPending}
          testID="photo-pick"
        />
        {data.photoUri ? (
          <>
            <View style={{ height: 8 }} />
            <Button
              label="Quitar foto"
              variant="ghost"
              onPress={() =>
                setPhoto.mutate(null, {
                  onSuccess: () => setNotice({ text: 'Foto eliminada', error: false }),
                })
              }
              disabled={setPhoto.isPending}
              testID="photo-remove"
            />
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.section, { color: palette.text }]}>Datos de contacto</Text>
        <TextField
          label="RUT"
          value={user ? formatRut(user.rut) : ''}
          onChangeText={() => {}}
          editable={false}
          accessibilityHint="Tu RUT es tu identidad en AlivIA y no puede modificarse."
        />
        <Text style={hint}>Tu RUT es tu identidad en AlivIA y no puede modificarse.</Text>
        <TextField
          label="Nombre completo"
          value={user?.name ?? ''}
          onChangeText={() => {}}
          editable={false}
          accessibilityHint="Tu nombre queda fijado por la invitación que creó tu cuenta y no puede modificarse."
        />
        <Text style={hint}>
          Tu nombre queda fijado por la invitación que creó tu cuenta y no puede modificarse.
        </Text>
        <TextField
          label="Correo electrónico"
          value={email}
          onChangeText={(value) =>
            setDraft({ email: value, phone, sourceEmail, sourcePhone })
          }
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          testID="contact-email"
        />
        <TextField
          label="Teléfono"
          value={phone}
          onChangeText={(value) =>
            setDraft({ email, phone: value, sourceEmail, sourcePhone })
          }
          keyboardType="phone-pad"
          testID="contact-phone"
        />
        <Button
          label="Guardar datos de contacto"
          onPress={onSaveContact}
          disabled={updateContact.isPending}
          testID="contact-save"
        />
      </Card>

      <Card>
        <Text style={[styles.section, { color: palette.text }]}>Mi equipo</Text>
        {team.length === 0 ? (
          <Text style={{ color: palette.textMuted, lineHeight: 21 }}>Sin médico vinculado</Text>
        ) : (
          team.map((member) => (
            <Text key={member.id} style={{ color: palette.text, lineHeight: 22, marginBottom: 8 }}>
              {teamMemberLine(member)}
            </Text>
          ))
        )}
      </Card>

      <Card>
        <Text style={[styles.section, { color: palette.text }]}>Mi tratamiento</Text>
        {meds.length === 0 ? (
          <Text style={{ color: palette.textMuted, lineHeight: 21 }}>
            Tu médico aún no registra un tratamiento en AlivIA. Aparecerá aquí cuando lo indique.
          </Text>
        ) : (
          meds.map((med) => (
            <View key={med.id} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: '700', color: palette.text }}>{medicationTitle(med)}</Text>
              <Text style={{ color: palette.textMuted, marginTop: 2, lineHeight: 20 }}>
                {medicationDetail(med)}
              </Text>
            </View>
          ))
        )}
      </Card>

      {requests.length > 0 ? (
        <Card>
          <Text style={[styles.section, { color: palette.text }]}>Solicitudes de vinculación</Text>
          <Text style={{ color: palette.textMuted, lineHeight: 21, marginBottom: 12 }}>
            Un profesional pide vincularte a su cartera para acompañar tu seguimiento. Tú decides.
          </Text>
          {requests.map((request) => {
            const expiry = teamExpiryText(request.expiresAt);
            return (
              <View key={request.id} style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: '700', color: palette.text }}>{request.requesterName}</Text>
                <Text style={{ color: palette.textMuted, marginTop: 2 }}>
                  {roleLabel(request.requesterRole)}
                  {request.specialty ? ` · ${request.specialty}` : ''} ·{' '}
                  {new Date(request.createdAt).toLocaleDateString('es-CL')}
                </Text>
                {expiry ? (
                  <Text style={{ color: palette.text, marginTop: 4 }}>Acceso temporal · {expiry}</Text>
                ) : null}
                {request.status === 'Pendiente' ? (
                  <View style={styles.requestActions}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Aprobar"
                        onPress={() =>
                          decideLink.mutate(
                            { requestId: request.id, status: 'Aprobado' },
                            {
                              onSuccess: () =>
                                setNotice({ text: 'Vinculación aprobada', error: false }),
                            },
                          )
                        }
                        disabled={decideLink.isPending}
                        testID={`link-approve-${request.id}`}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Rechazar"
                        variant="ghost"
                        onPress={() =>
                          decideLink.mutate(
                            { requestId: request.id, status: 'Rechazado' },
                            {
                              onSuccess: () =>
                                setNotice({ text: 'Solicitud rechazada', error: false }),
                            },
                          )
                        }
                        disabled={decideLink.isPending}
                        testID={`link-reject-${request.id}`}
                      />
                    </View>
                  </View>
                ) : (
                  <Text style={{ fontWeight: '800', color: palette.text, marginTop: 6 }}>
                    {request.status}
                  </Text>
                )}
              </View>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <View style={styles.identity}>
          <IconTile name="warn" color={palette.danger} background={mode === 'dark' ? '#3a2428' : '#fbe9ea'} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: palette.textDanger }}>En caso de crisis de dolor</Text>
            <Text style={{ color: palette.textMuted, marginTop: 6, lineHeight: 21 }}>
              Urgencias: <Text style={{ fontWeight: '800' }}>131</Text>
            </Text>
          </View>
        </View>
      </Card>
      <ConsentCard />
      <Button
        label="Ver política de privacidad"
        variant="ghost"
        onPress={() => navigation.navigate('PoliticaPrivacidad')}
        testID="privacy-open"
      />
      <View style={{ height: 12 }} />
      <Card>
        <Text style={{ fontWeight: '800', color: palette.text }}>Recordatorios</Text>
        <Text style={{ color: palette.textMuted, marginTop: 6, lineHeight: 21, marginBottom: 12 }}>
          Avisos en este teléfono, sin internet: registro diario, medicamentos, consulta y horario silencioso.
        </Text>
        <Button
          label="Configurar recordatorios"
          variant="ghost"
          onPress={() => navigation.navigate('Recordatorios')}
          testID="reminders-open"
        />
      </Card>
      <Card>
        <Text style={[styles.section, { color: palette.text }]}>Mi cuenta y mis datos</Text>
        <Text style={{ color: palette.textMuted, lineHeight: 21, marginBottom: 12 }}>
          La ficha se arma en este teléfono con los datos que ya tiene la app.
        </Text>
        <Button label="Descargar mi ficha" variant="ghost" onPress={onDownload} testID="record-download" />
        <View style={{ height: 8 }} />
        {confirmingDelete ? (
          <View testID="delete-account-dialog">
            <Text accessibilityRole="header" style={{ fontWeight: '800', fontSize: 18, color: palette.text }}>
              {DELETE_ACCOUNT_TITLE}
            </Text>
            <Text style={{ color: palette.text, lineHeight: 21, marginTop: 8 }}>{DELETE_ACCOUNT_INTRO}</Text>
            <Text style={{ color: palette.text, lineHeight: 21, marginTop: 8 }}>
              {DELETE_ACCOUNT_RECORD}
              <Text style={{ fontWeight: '800' }}>{DELETE_ACCOUNT_RECORD_STRONG}</Text>
              {DELETE_ACCOUNT_RECORD_REST}
            </Text>
            <Text style={{ color: palette.text, lineHeight: 21, marginTop: 8 }}>{DELETE_ACCOUNT_RETURN}</Text>
            <View style={{ height: 12 }} />
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={() => setConfirmingDelete(false)}
              testID="delete-account-cancel"
            />
            <View style={{ height: 8 }} />
            <Button
              label="Eliminar mi cuenta"
              onPress={onDeleteAccount}
              disabled={deleteAccount.isPending}
              testID="delete-account-confirm"
            />
          </View>
        ) : (
          <Button
            label="Eliminar mi cuenta"
            variant="ghost"
            onPress={() => setConfirmingDelete(true)}
            testID="delete-account"
          />
        )}
        <Text style={{ color: palette.textMuted, marginTop: 8, lineHeight: 21 }}>
          {ACCOUNT_RETENTION_NOTE}
        </Text>
      </Card>
      {user?.profile === 'demo' ? (
        <>
          <Button
            label="Restablecer datos demo"
            variant="ghost"
            onPress={onResetDemo}
            disabled={resetDemo.isPending}
          />
          {resetMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: palette.textPrimary, fontWeight: '600', marginBottom: 8 }}
            >
              {resetMessage}
            </Text>
          ) : null}
        </>
      ) : null}
      <Button label="Cerrar sesión" variant="ghost" onPress={signOut} />
      <View style={{ height: 8 }} />
      <Button label="Cambiar tema" variant="ghost" onPress={toggleMode} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photo: { width: 56, height: 56, borderRadius: 16 },
  section: { fontWeight: '800', fontSize: 16, marginBottom: 12 },
  requestActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
