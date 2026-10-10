import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');
const script = path.join(root, 'scripts', 'sync-core.mjs');

function hasWebSourceForSync(): boolean {
  const candidates = [
    path.join(root, 'AlivIACare', 'src', 'data', 'rut.ts'),
    path.resolve(root, '../../AlivIACare/src/data/rut.ts'),
    path.resolve(root, '../../_wt/OLA-0-WEB/src/data/rut.ts'),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

/** En GitHub Actions solo se clona AliviaParaCel; AlivIACare suele ser privado en otro org → no se puede hacer --check ahí. */
const skipInCiWithoutWeb = process.env.CI === 'true' && !hasWebSourceForSync();

describe('sync-core', () => {
  (skipInCiWithoutWeb ? it.skip : it)('las copias en src/shared/core están al día', () => {
    expect(() => {
      execFileSync(process.execPath, [script, '--check'], { cwd: root, stdio: 'pipe' });
    }).not.toThrow();
  });
});
