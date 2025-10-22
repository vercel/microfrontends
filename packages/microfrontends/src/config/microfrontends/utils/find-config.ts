import fs from 'node:fs';
import { join } from 'node:path';
import { CONFIGURATION_FILENAMES } from '../../constants';

export function findConfig({ dir }: { dir: string }): string | null {
  for (const filename of CONFIGURATION_FILENAMES) {
    const maybeConfig = join(dir, filename);
    if (fs.existsSync(maybeConfig)) {
      return maybeConfig;
    }
  }

  return null;
}
