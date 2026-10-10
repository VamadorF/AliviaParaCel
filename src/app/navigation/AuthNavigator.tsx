import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { PRIVACY_POLICY_TITLE } from '@/shared/data/privacy-policy';
import { PrivacyPolicyScreen } from '@/shared/screens/PrivacyPolicyScreen';
import type { AuthStackParamList } from '@/shared/types/navigation';
import { useTheme } from '@/shared/theme/ThemeContext';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { palette } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="PoliticaPrivacidad"
        component={PrivacyPolicyScreen}
        options={{ headerShown: true, title: PRIVACY_POLICY_TITLE }}
      />
    </Stack.Navigator>
  );
}
