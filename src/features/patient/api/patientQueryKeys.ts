export const patientQueryKeys = {
  bootstrap: (userId: string) => ['patient', 'bootstrap', userId] as const,
};
