import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PatientProfileScreen } from '@/features/patient/screens/PatientProfileScreen';
import { RemindersScreen } from '@/features/patient/screens/RemindersScreen';
import { PRIVACY_POLICY_TITLE } from '@/shared/data/privacy-policy';
import { PrivacyPolicyScreen } from '@/shared/screens/PrivacyPolicyScreen';
import type { PerfilStackParamList } from '@/shared/types/navigation';
import { useTheme } from '@/shared/theme/ThemeContext';

const Stack = createNativeStackNavigator<PerfilStackParamList>();

export function PerfilNavigator() {
  const { palette } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="PerfilHome" component={PatientProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Recordatorios" component={RemindersScreen} options={{ title: 'Recordatorios' }} />
      <Stack.Screen
        name="PoliticaPrivacidad"
        component={PrivacyPolicyScreen}
        options={{ title: PRIVACY_POLICY_TITLE }}
      />
    </Stack.Navigator>
  );
}
