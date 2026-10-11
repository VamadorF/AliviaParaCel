import { fhirBodySite } from '@/features/patient/utils/body-map';
import {
  fhirPainDescriptorCode,
  painDescriptorLabel,
  type PainDescriptorId,
} from '@/features/patient/utils/pain-descriptors';
import type { CheckInRecord } from '@/features/patient/types';

function descriptorComponents(descriptors: PainDescriptorId[] | undefined) {
  if (!descriptors?.length) return undefined;
  return descriptors.map((id) => ({
    code: { text: 'Descriptor del dolor' },
    valueCodeableConcept: {
      text: painDescriptorLabel(id),
      coding: [fhirPainDescriptorCode(id)],
    },
  }));
}

/** PAC-16 / PAC-17 · Observaciones de dolor con bodySite y descriptores en el JSON local. */
export function painObservationsForExport(checkIns: CheckInRecord[]) {
  return checkIns.map((record, index) => ({
    resourceType: 'Observation',
    id: `pain-${record.id || index}`,
    code: '72514-3',
    valueQuantity: record.pain,
    effectiveDateTime: record.createdAt ?? `${record.date}T${record.time}`,
    bodySite: (record.painSites ?? []).map((site) => fhirBodySite(site)),
    component: descriptorComponents(record.painDescriptors),
    note: record.zones.length ? `Zonas: ${record.zones.join(', ')}` : undefined,
  }));
}
