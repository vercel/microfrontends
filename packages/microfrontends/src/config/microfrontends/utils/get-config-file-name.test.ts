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
      expected: [
        'mfe-dev.jsonc',
        'microfrontends.json',
        'microfrontends.jsonc',
      ],
    },
  ])('returns the filenames or throws an error if the filename is invalid', ({
    customConfigFilename,
    expected,
  }) => {
    const result = getPossibleConfigurationFilenames({
      customConfigFilename,
    });
    expect(result).toEqual(expected);
  });
});
