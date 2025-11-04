// ordered by most likely to be the correct one
const DEFAULT_CONFIGURATION_FILENAMES = [
  'microfrontends.json',
  'microfrontends.jsonc',
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
        `Found VC_MICROFRONTENDS_CONFIG_FILE_NAME but the name is invalid. Received: ${customConfigFilename}.` +
          ` The file name must end with '.json' or '.jsonc'.` +
          ` It's also possible for the env var to include the path, eg microfrontends-dev.json or /path/to/microfrontends-dev.json.`,
      );
    }
    return Array.from(
      new Set([customConfigFilename, ...DEFAULT_CONFIGURATION_FILENAMES]),
    );
  }
  return DEFAULT_CONFIGURATION_FILENAMES;
}
