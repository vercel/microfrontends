import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function bypassStorageStatePath(baseURL: string): string {
  const id = createHash('sha256')
    .update(baseURL.replace(/\/$/, ''))
    .digest('hex')
    .slice(0, 16);
  return join(tmpdir(), `mfe-playwright-bypass-${id}.json`);
}
