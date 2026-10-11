import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function source(rel: string): string {
  return readFileSync(join(SRC, rel), 'utf8');
}

describe('ACC-04 móvil · nombres para el lector', () => {
  it('un botón anuncia su etiqueta', () => {
    const button = source('shared/components/Button.tsx');
    expect(button).toContain('accessibilityRole="button"');
    expect(button).toContain('accessibilityLabel={label}');
  });

  it('el login no usa el placeholder como único nombre', () => {
    const login = source('features/auth/screens/LoginScreen.tsx');
    const field = source('shared/components/TextField.tsx');
    expect(login).toContain('label="RUT"');
    expect(login).toContain('label="Contraseña"');
    expect(login).toContain('label="Entrar con RUT"');
    expect(login).toContain('label="Entrar en modo demo"');
    expect(field).toContain('accessibilityLabel={label}');
    expect(field).toContain('placeholder={placeholder}');
  });

  it('el check-in anuncia Paso N de M y nombra los controles ambiguos', () => {
    const checkin = source('features/patient/screens/CheckinScreen.tsx');
    const fields = source('features/patient/components/CheckinFields.tsx');
    expect(checkin).toContain('const stepAnnouncement = `Paso ${stepNumber} de ${stepTotal}`');
    expect(checkin).toContain('AccessibilityInfo.announceForAccessibility(stepAnnouncement)');
    expect(checkin).toContain('accessibilityLabel={stepAnnouncement}');
    expect(checkin).toContain('accessibilityLabel="Urgencias: No"');
    expect(checkin).toContain('accessibilityLabel="Urgencias: Sí"');
    expect(checkin).toContain('accessibilityLabel="Quién registra: Yo"');
    expect(checkin).toContain('accessibilityLabel={`Dolor ${n}, ${painLabel(n)}`}');
    expect(checkin).toContain('Sueño: menos de 5 horas');
    expect(checkin).toContain('Sueño: 7 horas o más');
    expect(fields).toContain('accessibilityLabel={label}');
  });

  it('la instrucción del equipo tiene rol y texto accesible', () => {
    const diario = source('features/patient/screens/DiarioScreen.tsx');
    expect(diario).toContain('accessibilityLabel="Instrucción de tu equipo"');
    expect(diario).toContain('accessibilityRole="header"');
    expect(diario).toContain('accessibilityRole="text"');
    expect(diario).toContain('accessibilityLabel={data.instruction.text}');
    expect(diario).toContain('accessibilityLabel="Entendido, instrucción de tu equipo"');
  });
});
