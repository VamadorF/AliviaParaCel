import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PRIVACY_POLICY_DRAFT, PRIVACY_POLICY_VERSION, privacyPolicyText } from '@/shared/data/privacy-policy';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('PAC-03 · política de privacidad', () => {
  it('el texto incluye la versión 0.1 y el rótulo de borrador', () => {
    expect(PRIVACY_POLICY_VERSION).toBe('0.1');
    const text = privacyPolicyText();
    expect(text).toContain(PRIVACY_POLICY_DRAFT);
    expect(text).toContain('Borrador pendiente de revisión legal');
    expect(text).toContain('Versión 0.1');
    expect(text).toContain('Política de privacidad');
    expect(text).toContain('Términos de uso');

    const screen = readFileSync(join(SRC, 'shared', 'screens', 'PrivacyPolicyScreen.tsx'), 'utf8');
    expect(screen).toContain('PRIVACY_POLICY_DRAFT');
    expect(screen).toContain('Versión {PRIVACY_POLICY_VERSION}');

    for (const file of [
      join(SRC, 'features', 'auth', 'screens', 'LoginScreen.tsx'),
      join(SRC, 'features', 'patient', 'screens', 'PatientProfileScreen.tsx'),
    ]) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).toContain('Ver política de privacidad');
      expect(src, file).toContain("navigate('PoliticaPrivacidad')");
    }
  });
});
