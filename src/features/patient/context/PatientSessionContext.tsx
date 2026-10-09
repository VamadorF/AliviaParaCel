import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { appendCheckIn, loadBootstrap } from '@/features/patient/api/patientApi';
import type { CheckInRecord, PatientBootstrap } from '@/features/patient/types';

type PatientSessionValue = {
  data: PatientBootstrap;
  saveCheckIn: (record: CheckInRecord) => void;
  lastSavedMessage: string | null;
  clearSavedMessage: () => void;
};

const PatientSessionContext = createContext<PatientSessionValue | null>(null);

export function PatientSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [data, setData] = useState<PatientBootstrap>(() =>
    loadBootstrap(user?.profile ?? 'clean'),
  );
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) setData(loadBootstrap(user.profile));
  }, [user]);

  const saveCheckIn = useCallback((record: CheckInRecord) => {
    setData((prev) => appendCheckIn(prev, record));
    setLastSavedMessage('Registro guardado');
  }, []);

  const clearSavedMessage = useCallback(() => setLastSavedMessage(null), []);

  const value = useMemo(
    () => ({ data, saveCheckIn, lastSavedMessage, clearSavedMessage }),
    [data, saveCheckIn, lastSavedMessage, clearSavedMessage],
  );

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
