import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { canWriteUserCache } from '@/features/auth/session/session';
import {
  appendPatientCheckIn,
  fetchPatientBootstrap,
  resetPatientDemoData,
  setPatientConsent,
} from '@/features/patient/api/patientApi';
import { patientQueryKeys } from '@/features/patient/api/patientQueryKeys';
import type { CheckInRecord, ConsentAction, PatientBootstrap } from '@/features/patient/types';

function cacheBootstrap(
  queryClient: QueryClient,
  userId: string | undefined,
  data: PatientBootstrap,
) {
  if (!userId || !canWriteUserCache(userId)) return;
  queryClient.setQueryData(patientQueryKeys.bootstrap(userId), data);
}

export function usePatientBootstrapQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: patientQueryKeys.bootstrap(user?.id ?? ''),
    queryFn: () => fetchPatientBootstrap(user!.id, user!.profile),
    enabled: Boolean(user),
  });
}

export function useAppendCheckInMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (record: CheckInRecord) =>
      appendPatientCheckIn(user!.id, user!.profile, record),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}

export function useSetConsentMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: ConsentAction) =>
      setPatientConsent(user!.id, user!.profile, action, new Date().toISOString()),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}

export function useResetDemoDataMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetPatientDemoData(user!.id, user!.profile),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}
