/** Número de urgencias SAMU (Chile). Tocar abre `tel:131`. */
export const EMERGENCY_TEL = '131';

type ClinicWithPhone = {
  phone?: string | null;
};

/**
 * Teléfono del centro si la clínica del paciente lo trae.
 * `null` cuando no hay clínica o el teléfono está vacío: en ese caso no se muestra.
 */
export function centerPhoneOf(clinic: ClinicWithPhone | null | undefined): string | null {
  const phone = clinic?.phone?.trim() ?? '';
  return phone.length > 0 ? phone : null;
}

/** URI `tel:` sin espacios, lista para `Linking.openURL`. */
export function telHref(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, '')}`;
}
