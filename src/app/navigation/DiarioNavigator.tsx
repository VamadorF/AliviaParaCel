import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CheckinScreen } from '@/features/patient/screens/CheckinScreen';
import { DiarioScreen } from '@/features/patient/screens/DiarioScreen';
import type { DiarioStackParamList } from '@/shared/types/navigation';
import { useTheme } from '@/shared/theme/ThemeContext';

const Stack = createNativeStackNavigator<DiarioStackParamList>();

export function DiarioNavigator() {
  const { palette } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen
        name="DiarioHome"
        component={DiarioScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Checkin"
        component={CheckinScreen}
        options={{ title: 'Check-in diario' }}
      />
    </Stack.Navigator>
  );
}
