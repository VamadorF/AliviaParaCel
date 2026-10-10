import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SCREEN = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'screens',
  'ComunidadScreen.tsx',
);

const NOTICE = 'No reemplaza la consulta con tu equipo tratante';

function visibleSource(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('COM-02 · aviso en Comunidad', () => {
  it('muestra una sola vez que no reemplaza la consulta con el equipo tratante', () => {
    const source = visibleSource(readFileSync(SCREEN, 'utf8'));
    const matches = source.match(/No reemplaza la consulta con tu equipo tratante/g) ?? [];
    expect(matches).toHaveLength(1);

    const disclaimer = source.match(/testID="community-disclaimer"[\s\S]*?<\/View>/);
    expect(disclaimer?.[0]).toContain(NOTICE);
  });
});
