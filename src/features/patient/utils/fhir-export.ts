import { fhirBodySite } from '@/features/patient/utils/body-map';
import type { CheckInRecord } from '@/features/patient/types';

/** PAC-16 · Observaciones de dolor con bodySite en el JSON local. */
export function painObservationsForExport(checkIns: CheckInRecord[]) {
  return checkIns.map((record, index) => ({
    resourceType: 'Observation',
    id: `pain-${record.id || index}`,
    code: '72514-3',
    valueQuantity: record.pain,
    effectiveDateTime: record.createdAt ?? `${record.date}T${record.time}`,
    bodySite: (record.painSites ?? []).map((site) => fhirBodySite(site)),
    note: record.zones.length ? `Zonas: ${record.zones.join(', ')}` : undefined,
  }));
}
