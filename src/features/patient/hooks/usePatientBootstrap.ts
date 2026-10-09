import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  appendPatientCheckIn,
  fetchPatientBootstrap,
  resetPatientDemoData,
} from '@/features/patient/api/patientApi';
import { patientQueryKeys } from '@/features/patient/api/patientQueryKeys';
import type { CheckInRecord } from '@/features/patient/types';

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
      if (user) {
        queryClient.setQueryData(patientQueryKeys.bootstrap(user.id), data);
      }
    },
  });
}

export function useResetDemoDataMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetPatientDemoData(user!.id, user!.profile),
    onSuccess: (data) => {
      if (user) {
        queryClient.setQueryData(patientQueryKeys.bootstrap(user.id), data);
      }
    },
  });
}
