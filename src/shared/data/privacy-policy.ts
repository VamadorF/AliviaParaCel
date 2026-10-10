/** Borrador PAC-03. No es texto legal definitivo: falta revisión legal. */
export const PRIVACY_POLICY_VERSION = '0.1';

export const PRIVACY_POLICY_DRAFT = 'Borrador pendiente de revisión legal';

export const PRIVACY_POLICY_TITLE = 'Política de privacidad y términos';

export const PRIVACY_POLICY_INTRO =
  'Este texto es un borrador. Sirve para mostrar dónde se leerán la política de privacidad y los términos. No es la versión definitiva ni un consejo legal.';

export const PRIVACY_POLICY_SECTIONS = [
  {
    heading: 'Política de privacidad',
    body: 'AlivIA puede tratar datos de contacto y de salud que tú, un cuidador o tu equipo registran, para el seguimiento del dolor crónico. Desde el perfil puedes revisar tu consentimiento y usar las opciones de la cuenta para descargar o pedir la eliminación de tus datos. Si un cuidador registra por ti, sus datos de contacto se resguardan con las mismas reglas.',
  },
  {
    heading: 'Términos de uso',
    body: 'AlivIA es una herramienta de seguimiento entre consultas. No reemplaza a tu equipo médico ni a un servicio de urgencia. Crear una cuenta implica aceptar este borrador hasta que se publique un texto revisado, con otro número de versión.',
  },
] as const;

/** Texto que muestra la pantalla, para comprobar versión y rótulo sin montar React Native. */
export function privacyPolicyText(): string {
  const sections = PRIVACY_POLICY_SECTIONS.map((section) => `${section.heading}\n${section.body}`).join('\n\n');
  return [
    PRIVACY_POLICY_DRAFT,
    PRIVACY_POLICY_TITLE,
    `Versión ${PRIVACY_POLICY_VERSION}`,
    PRIVACY_POLICY_INTRO,
    sections,
  ].join('\n\n');
}
