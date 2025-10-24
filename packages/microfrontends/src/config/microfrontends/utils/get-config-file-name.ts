import { customConfigFilenameEnvVar } from '../../constants';

const DEFAULT_CONFIGURATION_FILENAMES = [
  'microfrontends.jsonc',
  'microfrontends.json',
] as const;

export function getPossibleConfigurationFilenames({
  customConfigFilename,
}: {
  // from env
  customConfigFilename: string | undefined;
}) {
  if (
    customConfigFilename?.endsWith('.json') ||
    customConfigFilename?.endsWith('.jsonc')
  ) {
    return Array.from(
      new Set([customConfigFilename, ...DEFAULT_CONFIGURATION_FILENAMES]),
    );
  }
  return DEFAULT_CONFIGURATION_FILENAMES;
}

export { customConfigFilenameEnvVar };
