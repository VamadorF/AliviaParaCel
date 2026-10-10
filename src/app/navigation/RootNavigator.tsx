import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/app/providers/AuthProvider';
import { AuthNavigator } from '@/app/navigation/AuthNavigator';
import { MainTabs } from '@/app/navigation/MainTabs';
import { PatientSessionProvider } from '@/features/patient/context/PatientSessionContext';
import { ReminderProvider } from '@/features/patient/notifications/ReminderProvider';
import type { RootStackParamList } from '@/shared/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainShell() {
  return (
    <PatientSessionProvider>
      <ReminderProvider>
        <MainTabs />
      </ReminderProvider>
    </PatientSessionProvider>
  );
}

export function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainShell} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
