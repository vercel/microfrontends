import { hashApplicationName } from './hash-application-name';

const PREFIX = 'vc-ap';

export function generateAssetPrefixFromName({
  name,
}: {
  name: string;
}): string {
  if (!name) {
    throw new Error('Name is required to generate an asset prefix');
  }

  return `${PREFIX}-${hashApplicationName(name)}`;
}
