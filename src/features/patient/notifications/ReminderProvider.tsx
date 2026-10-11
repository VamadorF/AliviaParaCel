import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { syncScheduledReminders, type SyncResult } from '@/features/patient/notifications/localScheduler';
import {
  defaultReminderSettings,
  loadReminderSettings,
  planLocalReminders,
  reminderMedications,
  saveReminderSettings,
  type ReminderSettings,
} from '@/features/patient/notifications/reminders';
import { asyncStoragePort } from '@/shared/storage/asyncStorageAdapter';

type ReminderContextValue = {
  settings: ReminderSettings;
  ready: boolean;
  permission: SyncResult | 'unknown';
  update: (next: ReminderSettings, requestPermission?: boolean) => void;
  ensurePermission: () => void;
};

const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data } = usePatientSession();
  const userId = user?.id;
  const [settings, setSettings] = useState<ReminderSettings>(defaultReminderSettings);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [permission, setPermission] = useState<SyncResult | 'unknown'>('unknown');
  const [epoch, setEpoch] = useState(0);
  const askRef = useRef(false);
  const ready = userId != null && loadedFor === userId;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const id = userId;
    void loadReminderSettings(asyncStoragePort, id).then((loaded) => {
      if (cancelled) return;
      setSettings(loaded);
      setLoadedFor(id);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = useCallback(
    (next: ReminderSettings, requestPermission = false) => {
      if (requestPermission) askRef.current = true;
      setSettings(next);
      if (userId) void saveReminderSettings(asyncStoragePort, userId, next);
    },
    [userId],
  );

  const ensurePermission = useCallback(() => {
    askRef.current = true;
    setEpoch((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!ready || !userId) return;
    const ask = askRef.current;
    askRef.current = false;
    const plan = planLocalReminders({
      settings,
      medications: reminderMedications(data.medications),
      appointment: data.appointment,
      now: new Date(),
    });
    let cancelled = false;
    void syncScheduledReminders(plan, { requestPermission: ask }).then((result) => {
      if (!cancelled) setPermission(result);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, userId, settings, data.medications, data.appointment, epoch]);

  return (
    <ReminderContext.Provider value={{ settings, ready, permission, update, ensurePermission }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminders debe usarse dentro de ReminderProvider');
  return ctx;
}
