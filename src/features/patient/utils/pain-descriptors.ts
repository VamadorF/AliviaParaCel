/** PAC-17 · Descriptores opcionales del dolor (chips + FHIR). */
export const PAIN_DESCRIPTOR_IDS = [
  'punzante',
  'quemante',
  'electrico',
  'opresivo',
  'hormigueo',
] as const;

export type PainDescriptorId = (typeof PAIN_DESCRIPTOR_IDS)[number];

export const PAIN_DESCRIPTOR_LABEL: Record<PainDescriptorId, string> = {
  punzante: 'Punzante',
  quemante: 'Quemante',
  electrico: 'Eléctrico',
  opresivo: 'Opresivo',
  hormigueo: 'Hormigueo',
};

export function painDescriptorLabel(id: string): string {
  return PAIN_DESCRIPTOR_LABEL[id as PainDescriptorId] ?? id;
}

export function togglePainDescriptor(selected: string[], id: PainDescriptorId): string[] {
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

export function sanitizePainDescriptors(selected: string[]): PainDescriptorId[] {
  return PAIN_DESCRIPTOR_IDS.filter((id) => selected.includes(id));
}

/** Código SNOMED CT simplificado para export FHIR local. */
export function fhirPainDescriptorCode(id: PainDescriptorId) {
  const coding: Record<PainDescriptorId, { system: string; code: string; display: string }> = {
    punzante: {
      system: 'http://snomed.info/sct',
      code: '55102000',
      display: 'Sharp pain',
    },
    quemante: {
      system: 'http://snomed.info/sct',
      code: '36390002',
      display: 'Burning pain',
    },
    electrico: {
      system: 'http://snomed.info/sct',
      code: '162500004',
      display: 'Shooting pain',
    },
    opresivo: {
      system: 'http://snomed.info/sct',
      code: '55101001',
      display: 'Crushing pain',
    },
    hormigueo: {
      system: 'http://snomed.info/sct',
      code: '62507009',
      display: 'Pins and needles',
    },
  };
  return coding[id];
}
