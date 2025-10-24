import fs from 'node:fs';
import { join } from 'node:path';
import { getPossibleConfigurationFilenames } from './get-config-file-name';

export function findConfig({
  dir,
  customConfigFilename,
}: {
  dir: string;
  customConfigFilename: string | undefined;
}): string | null {
  for (const filename of getPossibleConfigurationFilenames({
    customConfigFilename,
  })) {
    const maybeConfig = join(dir, filename);
    if (fs.existsSync(maybeConfig)) {
      return maybeConfig;
    }
  }

  return null;
}
