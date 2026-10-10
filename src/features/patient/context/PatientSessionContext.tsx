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
  useSetConsentMutation,
} from '@/features/patient/hooks/usePatientBootstrap';
import type { CheckInRecord, ConsentEvent, PatientBootstrap } from '@/features/patient/types';
import { consentHistoryOf, consentOf, type ConsentView } from '@/features/patient/utils/consent';
import { useTheme } from '@/shared/theme/ThemeContext';

type PatientSessionValue = {
  data: PatientBootstrap;
  isLoading: boolean;
  saveCheckIn: (record: CheckInRecord) => void;
  /** MOB-06 · Estado vigente del consentimiento (persistido) e historial. */
  consent: ConsentView;
  consentHistory: ConsentEvent[];
  /** Acepta (`true`) o revoca (`false`) el consentimiento; persiste con fecha real y versión. */
  setConsent: (granted: boolean) => void;
  isSavingConsent: boolean;
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
  const consentMutation = useSetConsentMutation();
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  const data = bootstrapQuery.data ?? EMPTY_BOOTSTRAP;
  const consent = useMemo(() => consentOf(data), [data]);
  const consentHistory = useMemo(() => consentHistoryOf(data), [data]);

  const saveCheckIn = useCallback(
    (record: CheckInRecord) => {
      appendMutation.mutate(record, {
        // El repositorio marca el registro según el consentimiento vigente (MOB-06).
        onSuccess: (saved) =>
          setLastSavedMessage(
            consentOf(saved).granted
              ? 'Registro guardado'
              : 'Registro guardado solo en este teléfono',
          ),
      });
    },
    [appendMutation],
  );

  const setConsent = useCallback(
    (granted: boolean) => {
      consentMutation.mutate(granted ? 'aceptado' : 'revocado');
    },
    [consentMutation],
  );

  const clearSavedMessage = useCallback(() => setLastSavedMessage(null), []);

  const value = useMemo(
    () => ({
      data,
      isLoading: bootstrapQuery.isLoading,
      saveCheckIn,
      consent,
      consentHistory,
      setConsent,
      isSavingConsent: consentMutation.isPending,
      lastSavedMessage,
      clearSavedMessage,
    }),
    [
      data,
      bootstrapQuery.isLoading,
      saveCheckIn,
      consent,
      consentHistory,
      setConsent,
      consentMutation.isPending,
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
