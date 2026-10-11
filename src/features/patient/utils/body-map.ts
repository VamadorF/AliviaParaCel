export type BodyView = 'front' | 'back';
export type BodyLaterality = 'izquierdo' | 'derecho' | 'bilateral';

export type PainSite = {
  region: string;
  view: BodyView;
  side: BodyLaterality;
};

export type BodyRegion = {
  id: string;
  label: string;
  front: boolean;
  back: boolean;
};

export const BODY_REGIONS: BodyRegion[] = [
  { id: 'cabeza', label: 'Cabeza', front: true, back: false },
  { id: 'cuello', label: 'Cuello', front: true, back: true },
  { id: 'hombro', label: 'Hombro', front: true, back: true },
  { id: 'torax', label: 'Tórax', front: true, back: false },
  { id: 'abdomen', label: 'Abdomen', front: true, back: false },
  { id: 'lumbar', label: 'Lumbar', front: false, back: true },
  { id: 'cadera', label: 'Cadera', front: true, back: true },
  { id: 'rodilla', label: 'Rodilla', front: true, back: true },
  { id: 'otro', label: 'Otro', front: true, back: true },
];

const LATERALITY_FHIR: Record<BodyLaterality, string> = {
  izquierdo: 'left',
  derecho: 'right',
  bilateral: 'bilateral',
};

export function regionsForView(view: BodyView): BodyRegion[] {
  return BODY_REGIONS.filter((r) => (view === 'front' ? r.front : r.back));
}

export function siteKey(site: PainSite): string {
  return `${site.view}:${site.region}:${site.side}`;
}

export function togglePainSite(sites: PainSite[], next: PainSite): PainSite[] {
  const key = siteKey(next);
  const exists = sites.some((s) => siteKey(s) === key);
  if (exists) return sites.filter((s) => siteKey(s) !== key);
  return [...sites, next];
}

export function formatPainSite(site: PainSite): string {
  const region = BODY_REGIONS.find((r) => r.id === site.region)?.label ?? site.region;
  const viewLabel = site.view === 'front' ? 'frontal' : 'posterior';
  const sideLabel =
    site.side === 'bilateral' ? 'bilateral' : site.side === 'izquierdo' ? 'izquierdo' : 'derecho';
  return `${region} (${sideLabel}, ${viewLabel})`;
}

export function zonesFromPainSites(sites: PainSite[]): string[] {
  return sites.map(formatPainSite);
}

export function fhirBodySite(site: PainSite) {
  return {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/bodysite-laterality',
        code: LATERALITY_FHIR[site.side],
      },
    ],
    text: formatPainSite(site),
  };
}

export function painSitesFromLegacyZones(zones: string[]): PainSite[] {
  return zones.map((z) => ({
    region: z.toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''),
    view: 'front' as const,
    side: 'bilateral' as const,
  }));
}
