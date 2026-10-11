/** MOB-13 · Orientación por patología (sin emojis como iconos). */

export type GuideCard = {
  icon: 'leaf' | 'book' | 'heart' | 'activity';
  title: string;
  desc: string;
  src: string;
  href: string;
};

export const BASE_GUIDE_CARDS: GuideCard[] = [
  {
    icon: 'activity',
    title: 'Respiración de caja (box breathing)',
    desc: 'Técnica guiada 4-4-4-4 para bajar la tensión durante los picos de dolor.',
    src: 'Video · Cleveland Clinic',
    href: 'https://health.clevelandclinic.org/box-breathing-benefits',
  },
  {
    icon: 'book',
    title: 'Dolor crónico: guías y avances',
    desc: 'Información oficial actualizada sobre manejo del dolor musculoesquelético.',
    src: 'OMS',
    href: 'https://www.who.int/es/news-room/fact-sheets/detail/musculoskeletal-conditions',
  },
];

const PATHOLOGY_CARDS: { match: RegExp; cards: GuideCard[] }[] = [
  {
    match: /fibromialgia/i,
    cards: [
      {
        icon: 'activity',
        title: 'Ejercicio suave para fibromialgia',
        desc: 'Rutinas de bajo impacto que reducen el dolor y mejoran el sueño.',
        src: 'Mayo Clinic',
        href: 'https://www.mayoclinic.org/diseases-conditions/fibromyalgia/diagnosis-treatment/drc-20354785',
      },
      {
        icon: 'leaf',
        title: 'Alimentación antiinflamatoria',
        desc: 'Qué alimentos ayudan a combatir la inflamación según la evidencia.',
        src: 'Harvard Health',
        href: 'https://www.health.harvard.edu/staying-healthy/foods-that-fight-inflammation',
      },
    ],
  },
  {
    match: /migra[ñn]|cefalea/i,
    cards: [
      {
        icon: 'book',
        title: 'Diario de migraña: identifica tus gatillantes',
        desc: 'Cómo registrar patrones que ayudan a prevenir las crisis.',
        src: 'American Migraine Foundation',
        href: 'https://americanmigrainefoundation.org/resource-library/keeping-headache-diary/',
      },
    ],
  },
];

export function guideCardsForPathology(pathology: string): GuideCard[] {
  const match = PATHOLOGY_CARDS.find((p) => p.match.test(pathology));
  if (match) return [...BASE_GUIDE_CARDS, ...match.cards];
  return [
    ...BASE_GUIDE_CARDS,
    {
      icon: 'heart',
      title: 'Ejercicio suave y gradual',
      desc: 'Rutinas de bajo impacto que suelen ayudar en dolor crónico, sin importar la causa.',
      src: 'Mayo Clinic',
      href: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/exercise/art-20048389',
    },
  ];
}
