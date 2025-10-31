import { getPossibleConfigurationFilenames } from './get-config-file-name';

describe('getPossibleConfigurationFilenames', () => {
  it.each([
    {
      customConfigFilename: 'microfrontends.json',
      expected: ['microfrontends.json', 'microfrontends.jsonc'],
    },
    {
      customConfigFilename: 'microfrontends-dev.json',
      expected: [
        'microfrontends-dev.json',
        'microfrontends.json',
        'microfrontends.jsonc',
      ],
    },
    {
      customConfigFilename: 'microfrontends-dev.jsonc',
      expected: [
        'microfrontends-dev.jsonc',
        'microfrontends.json',
        'microfrontends.jsonc',
      ],
    },
    {
      customConfigFilename: '/path/to/microfrontends-dev.jsonc',
      expected: [
        '/path/to/microfrontends-dev.jsonc',
        'microfrontends.json',
        'microfrontends.jsonc',
      ],
    },
    {
      customConfigFilename: 'mfe-dev.jsonc',
    },
  ])(
    'returns the filenames or throws an error if the filename is invalid',
    ({ customConfigFilename, expected }) => {
      if (expected) {
        const result = getPossibleConfigurationFilenames({
          customConfigFilename,
        });
        // eslint-disable-next-line jest/no-conditional-expect
        expect(result).toEqual(expected);
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(() =>
          getPossibleConfigurationFilenames({
            customConfigFilename,
          }),
        ).toThrow(
          `Found VC_MICROFRONTENDS_CONFIG_FILE_NAME but the name is invalid. Received: ${customConfigFilename}.` +
            ` The file name must start with microfrontends and end with '.json' or '.jsonc'.` +
            ` It's also possible for the env var to include the path, eg microfrontends-dev.json or /path/to/microfrontends-dev.json.`,
        );
      }
    },
  );
});
