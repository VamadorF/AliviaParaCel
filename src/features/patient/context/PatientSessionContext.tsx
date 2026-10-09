import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  useAppendCheckInMutation,
  usePatientBootstrapQuery,
} from '@/features/patient/hooks/usePatientBootstrap';
import type { CheckInRecord, PatientBootstrap } from '@/features/patient/types';
import { useTheme } from '@/shared/theme/ThemeContext';

type PatientSessionValue = {
  data: PatientBootstrap;
  isLoading: boolean;
  saveCheckIn: (record: CheckInRecord) => void;
  lastSavedMessage: string | null;
  clearSavedMessage: () => void;
};

const PatientSessionContext = createContext<PatientSessionValue | null>(null);

const EMPTY_BOOTSTRAP: PatientBootstrap = {
  medications: [],
  checkIns: [],
  appointment: null,
  instruction: null,
  messages: [],
  posts: [],
  messagingEnabled: false,
  doctorLinked: false,
};

export function PatientSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const bootstrapQuery = usePatientBootstrapQuery();
  const appendMutation = useAppendCheckInMutation();
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  const saveCheckIn = useCallback(
    (record: CheckInRecord) => {
      appendMutation.mutate(record, {
        onSuccess: () => setLastSavedMessage('Registro guardado'),
      });
    },
    [appendMutation],
  );

  const clearSavedMessage = useCallback(() => setLastSavedMessage(null), []);

  const data = bootstrapQuery.data ?? EMPTY_BOOTSTRAP;

  const value = useMemo(
    () => ({
      data,
      isLoading: bootstrapQuery.isLoading,
      saveCheckIn,
      lastSavedMessage,
      clearSavedMessage,
    }),
    [
      data,
      bootstrapQuery.isLoading,
      saveCheckIn,
      lastSavedMessage,
      clearSavedMessage,
    ],
  );

  if (user && bootstrapQuery.isLoading && !bootstrapQuery.data) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <PatientSessionContext.Provider value={value}>
      {children}
    </PatientSessionContext.Provider>
  );
}

export function usePatientSession() {
  const ctx = useContext(PatientSessionContext);
  if (!ctx) {
    throw new Error('usePatientSession requiere PatientSessionProvider');
  }
  return ctx;
}
