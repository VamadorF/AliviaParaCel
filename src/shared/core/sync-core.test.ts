import { execFileSync } from 'child_process';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');
const script = path.join(root, 'scripts', 'sync-core.mjs');

describe('sync-core', () => {
  it('las copias en src/shared/core están al día', () => {
    expect(() => {
      execFileSync(process.execPath, [script, '--check'], { cwd: root, stdio: 'pipe' });
    }).not.toThrow();
  });
});
