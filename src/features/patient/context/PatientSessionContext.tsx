import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { canWriteUserCache } from '@/features/auth/session/session';
import { patientRepository } from '@/features/patient/api/patientApi';
import { patientQueryKeys } from '@/features/patient/api/patientQueryKeys';
import {
  useAcknowledgeInstructionMutation,
  usePatientBootstrapQuery,
  useSetConsentMutation,
  useSubmitAppointmentAttendanceMutation,
  useSubmitPreConsultMutation,
} from '@/features/patient/hooks/usePatientBootstrap';
import type { AttendanceInput } from '@/features/patient/utils/appointment-attendance';
import {
  flushOutbox,
  loadOutbox,
  mergePending,
  newClientRequestId,
  submitOutbox,
  type OutboxItem,
} from '@/features/patient/sync/outbox';
import type {
  CheckInRecord,
  ConsentEvent,
  PatientBootstrap,
  PreConsultInput,
} from '@/features/patient/types';
import { consentHistoryOf, consentOf, type ConsentView } from '@/features/patient/utils/consent';
import { useIsOnline } from '@/shared/network/useIsOnline';
import { asyncStoragePort } from '@/shared/storage/asyncStorageAdapter';
import { useTheme } from '@/shared/theme/ThemeContext';

type PatientSessionValue = {
  data: PatientBootstrap;
  isLoading: boolean;
  saveCheckIn: (record: CheckInRecord) => void;
  /** Encola el mensaje al equipo si no hay red. Un texto vacío no se envía. */
  sendTeamMessage: (
    body: string,
    at: string,
    teamDoctorId?: string,
  ) => Promise<'pending' | 'sent' | 'empty'>;
  /** MOB-06 · Estado vigente del consentimiento (persistido) e historial. */
  consent: ConsentView;
  consentHistory: ConsentEvent[];
  /** Acepta (`true`) o revoca (`false`) el consentimiento; persiste con fecha real y versión. */
  setConsent: (granted: boolean) => void;
  isSavingConsent: boolean;
  /** PAC-08 · Acusa la instrucción vigente con la fecha real. Si ya estaba acusada, no duplica. */
  acknowledgeInstruction: () => void;
  isAcknowledgingInstruction: boolean;
  /** PAC-10 · Prepara la consulta vigente. Si ya hay respuesta, no duplica. */
  submitPreConsult: (input: PreConsultInput) => void;
  isSubmittingPreConsult: boolean;
  /** PAC-11 · Confirmación o reprogramación de la consulta vigente. */
  submitAppointmentAttendance: (input: AttendanceInput) => void;
  isSubmittingAppointmentAttendance: boolean;
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
  const queryClient = useQueryClient();
  const { online, ready } = useIsOnline();
  const bootstrapQuery = usePatientBootstrapQuery(online, ready);
  const consentMutation = useSetConsentMutation();
  const ackMutation = useAcknowledgeInstructionMutation();
  const preConsultMutation = useSubmitPreConsultMutation();
  const attendanceMutation = useSubmitAppointmentAttendanceMutation();
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<{ userId: string; items: OutboxItem[] }>({
    userId: '',
    items: [],
  });
  const outboxGen = useRef(0);

  const userId = user?.id;
  const queue = useMemo(
    () => (outbox.userId === userId ? outbox.items : []),
    [outbox, userId],
  );

  const publishQueue = useCallback((id: string, items: OutboxItem[]) => {
    outboxGen.current += 1;
    setOutbox({ userId: id, items });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const ticket = outboxGen.current;
    let cancelled = false;
    void loadOutbox(asyncStoragePort, userId).then((items) => {
      if (cancelled || ticket !== outboxGen.current) return;
      setOutbox({ userId, items });
    });
    return () => {
      cancelled = true;
    };
  }, [userId, bootstrapQuery.dataUpdatedAt]);

  useEffect(() => {
    if (!ready || !userId || !online || queue.length === 0) return;
    let cancelled = false;
    void flushOutbox(asyncStoragePort, patientRepository, true, userId).then((result) => {
      if (cancelled) return;
      // Otra pasada ya vació la cola: no ocultar el pendiente hasta que el bootstrap lo traiga.
      if (!result.data && result.queue.length === 0) return;
      if (result.data && canWriteUserCache(userId)) {
        queryClient.setQueryData(patientQueryKeys.bootstrap(userId), result.data);
      }
      publishQueue(userId, result.queue);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, online, userId, queue.length, queryClient, publishQueue]);

  const base = bootstrapQuery.data ?? EMPTY_BOOTSTRAP;
  const data = useMemo(() => mergePending(base, queue), [base, queue]);
  const consent = useMemo(() => consentOf(data), [data]);
  const consentHistory = useMemo(() => consentHistoryOf(data), [data]);

  const saveCheckIn = useCallback(
    (record: CheckInRecord) => {
      if (!user) return;
      const capturedAt = record.createdAt ?? new Date().toISOString();
      const clientRequestId = record.clientRequestId ?? newClientRequestId();
      void submitOutbox(asyncStoragePort, patientRepository, online, {
        kind: 'checkIn',
        clientRequestId,
        capturedAt,
        userId: user.id,
        profile: user.profile,
        record: { ...record, clientRequestId, createdAt: capturedAt },
      }).then((result) => {
        if (result.status === 'sent' && canWriteUserCache(user.id)) {
          queryClient.setQueryData(patientQueryKeys.bootstrap(user.id), result.data);
        }
        publishQueue(user.id, result.queue);
        if (result.status === 'pending') {
          setLastSavedMessage('pendiente de envío');
          return;
        }
        setLastSavedMessage(
          consentOf(result.data).granted
            ? 'Registro guardado'
            : 'Registro guardado solo en este teléfono',
        );
      });
    },
    [user, online, queryClient, publishQueue],
  );

  const sendTeamMessage = useCallback(
    async (body: string, at: string, teamDoctorId?: string) => {
      const trimmed = body.trim();
      if (!trimmed || !user) return 'empty' as const;
      const result = await submitOutbox(asyncStoragePort, patientRepository, online, {
        kind: 'teamMessage',
        clientRequestId: newClientRequestId(),
        capturedAt: at,
        userId: user.id,
        profile: user.profile,
        body: trimmed,
        ...(teamDoctorId ? { teamDoctorId } : {}),
      });
      if (result.status === 'sent' && canWriteUserCache(user.id)) {
        queryClient.setQueryData(patientQueryKeys.bootstrap(user.id), result.data);
      }
      publishQueue(user.id, result.queue);
      return result.status;
    },
    [user, online, queryClient, publishQueue],
  );

  const setConsent = useCallback(
    (granted: boolean) => {
      consentMutation.mutate(granted ? 'aceptado' : 'revocado');
    },
    [consentMutation],
  );

  const acknowledgeInstruction = useCallback(() => {
    ackMutation.mutate();
  }, [ackMutation]);

  const submitPreConsult = useCallback(
    (input: PreConsultInput) => {
      if (preConsultMutation.isPending) return;
      preConsultMutation.mutate(input);
    },
    [preConsultMutation],
  );

  const submitAppointmentAttendance = useCallback(
    (input: AttendanceInput) => {
      if (attendanceMutation.isPending) return;
      attendanceMutation.mutate(input);
    },
    [attendanceMutation],
  );

  const clearSavedMessage = useCallback(() => setLastSavedMessage(null), []);

  const value = useMemo(
    () => ({
      data,
      isLoading: bootstrapQuery.isLoading,
      saveCheckIn,
      sendTeamMessage,
      consent,
      consentHistory,
      setConsent,
      isSavingConsent: consentMutation.isPending,
      acknowledgeInstruction,
      isAcknowledgingInstruction: ackMutation.isPending,
      submitPreConsult,
      isSubmittingPreConsult: preConsultMutation.isPending,
      submitAppointmentAttendance,
      isSubmittingAppointmentAttendance: attendanceMutation.isPending,
      lastSavedMessage,
      clearSavedMessage,
    }),
    [
      data,
      bootstrapQuery.isLoading,
      saveCheckIn,
      sendTeamMessage,
      consent,
      consentHistory,
      setConsent,
      consentMutation.isPending,
      acknowledgeInstruction,
      ackMutation.isPending,
      submitPreConsult,
      preConsultMutation.isPending,
      submitAppointmentAttendance,
      attendanceMutation.isPending,
      lastSavedMessage,
      clearSavedMessage,
    ],
  );

  const waitingForBootstrap =
    Boolean(user) && !bootstrapQuery.data && (!ready || bootstrapQuery.isPending);

  if (waitingForBootstrap) {
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
