export const customConfigFilenameEnvVar = 'VC_MICROFRONTENDS_CONFIG_FILE_NAME';

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
    return [customConfigFilename, ...DEFAULT_CONFIGURATION_FILENAMES];
  }
  return DEFAULT_CONFIGURATION_FILENAMES;
}
