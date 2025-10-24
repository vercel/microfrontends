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
  if (customConfigFilename) {
    if (
      !customConfigFilename.endsWith('.json') &&
      !customConfigFilename.endsWith('.jsonc')
    ) {
      throw new Error(
        `The VC_MICROFRONTENDS_CONFIG_FILE_NAME environment variable must end with '.json' or '.jsonc'. Received: ${customConfigFilename}`,
      );
    }
    return Array.from(
      new Set([customConfigFilename, ...DEFAULT_CONFIGURATION_FILENAMES]),
    );
  }
  return DEFAULT_CONFIGURATION_FILENAMES;
}
