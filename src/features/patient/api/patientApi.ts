import type { PatientProfileKind } from '@/shared/mocks/users.mock';
import {
  CLEAN_BOOTSTRAP,
  DEMO_BOOTSTRAP,
} from '@/shared/mocks/patient.mock';
import type { CheckInRecord, PatientBootstrap } from '@/features/patient/types';

export function loadBootstrap(profile: PatientProfileKind): PatientBootstrap {
  const base = profile === 'demo' ? DEMO_BOOTSTRAP : CLEAN_BOOTSTRAP;
  return {
    ...base,
    checkIns: [...base.checkIns],
    messages: [...base.messages],
    posts: [...base.posts],
    medications: [...base.medications],
  };
}

export function appendCheckIn(
  data: PatientBootstrap,
  record: CheckInRecord,
): PatientBootstrap {
  return {
    ...data,
    checkIns: [record, ...data.checkIns],
  };
}
