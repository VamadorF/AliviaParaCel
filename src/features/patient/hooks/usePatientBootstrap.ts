import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { canWriteUserCache } from '@/features/auth/session/session';
import {
  acknowledgePatientInstruction,
  decidePatientLinkRequest,
  fetchPatientBootstrap,
  patientRepository,
  requestPatientAccountDeletion,
  resetPatientDemoData,
  setPatientConsent,
  setPatientPhoto,
  submitPatientPreConsult,
  updatePatientContact,
} from '@/features/patient/api/patientApi';
import { patientQueryKeys } from '@/features/patient/api/patientQueryKeys';
import { flushOutbox } from '@/features/patient/sync/outbox';
import type { ConsentAction, PatientBootstrap, PreConsultInput } from '@/features/patient/types';
import { persistAskDoctorToLeave } from '@/features/patient/utils/team-join';
import { asyncStoragePort } from '@/shared/storage/asyncStorageAdapter';

function cacheBootstrap(
  queryClient: QueryClient,
  userId: string | undefined,
  data: PatientBootstrap,
) {
  if (!userId || !canWriteUserCache(userId)) return;
  queryClient.setQueryData(patientQueryKeys.bootstrap(userId), data);
}

export function usePatientBootstrapQuery(online: boolean, ready: boolean) {
  const { user } = useAuth();

  return useQuery({
    queryKey: patientQueryKeys.bootstrap(user?.id ?? ''),
    // El mock vive en el teléfono: se lee aunque el navegador reporte sin red.
    networkMode: 'always',
    queryFn: async () => {
      if (online && user) {
        await flushOutbox(asyncStoragePort, patientRepository, true, user.id);
      }
      return fetchPatientBootstrap(user!.id, user!.profile);
    },
    enabled: Boolean(user) && ready,
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

export function useAcknowledgeInstructionMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      acknowledgePatientInstruction(user!.id, user!.profile, new Date().toISOString()),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}

export function useSubmitPreConsultMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PreConsultInput) =>
      submitPatientPreConsult(user!.id, user!.profile, input, new Date().toISOString()),
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

export function useDecideLinkRequestMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { requestId: string; status: 'Aprobado' | 'Rechazado' }) =>
      decidePatientLinkRequest(user!.id, user!.profile, input.requestId, input.status),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}

export function useAskDoctorToLeaveMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doctorId: string) =>
      persistAskDoctorToLeave(patientRepository, user!.id, user!.profile, doctorId),
    onSuccess: (result) => {
      if (result.ok) cacheBootstrap(queryClient, user?.id, result.data);
    },
  });
}

export function useUpdateContactMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; phone: string }) =>
      updatePatientContact(user!.id, user!.profile, input.email, input.phone),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}

export function useSetPhotoMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoUri: string | null) =>
      setPatientPhoto(user!.id, user!.profile, photoUri),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}

export function useRequestAccountDeletionMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestPatientAccountDeletion(user!.id, user!.profile),
    onSuccess: (data) => {
      cacheBootstrap(queryClient, user?.id, data);
    },
  });
}
