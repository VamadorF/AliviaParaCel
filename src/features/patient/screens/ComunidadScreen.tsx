import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { IconTile } from '@/shared/icons/AppIcon';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { useTheme } from '@/shared/theme/ThemeContext';

export function ComunidadScreen() {
  const { palette } = useTheme();
  const { data } = usePatientSession();

  return (
    <Screen>
      <BetaBanner />
      <View style={styles.titleRow}>
        <IconTile name="people" color={palette.primary} background={palette.primarySoft} />
        <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
          Comunidad
        </Text>
      </View>
      <Text style={{ color: palette.textMuted, marginBottom: 16, lineHeight: 21 }}>
        Lectura en beta. Publicar llegará en una versión posterior.
      </Text>
      {data.posts.map((post) => (
        <Card key={post.id}>
          <Text style={{ fontWeight: '800', color: palette.text }}>{post.author}</Text>
          <Text style={{ color: palette.text, marginTop: 8, lineHeight: 22 }}>{post.excerpt}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 8 }}>
            {new Date(post.at).toLocaleDateString('es-CL')}
          </Text>
        </Card>
      ))}
      {data.posts.length === 0 ? (
        <View style={styles.empty}>
          <IconTile name="people" color={palette.textMuted} background={palette.primarySoft} size={56} />
          <Text style={{ color: palette.textMuted }}>Sin publicaciones todavía.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
