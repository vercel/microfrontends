import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIR_ENV = 'MFE_PLAYWRIGHT_BYPASS_DIR';

// Workers inherit this env var, so they share the runner's private directory.
export function bypassStorageStatePath(): string {
  let dir = process.env[DIR_ENV];
  if (!dir) {
    dir = mkdtempSync(join(tmpdir(), 'mfe-playwright-'));
    process.env[DIR_ENV] = dir;
  }
  return join(dir, 'storage-state.json');
}
