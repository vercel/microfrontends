import { join } from 'node:path';
import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { transform } from './transpile-packages';

const fixtures = fileURLToPath(
  new URL('../../../config/__fixtures__', import.meta.url),
);

type TestCase = {
  description: string;
  input: {
    next: Record<string, unknown>;
    app: {
      name: string;
    };
  };
} & (
  | { expected: Record<string, unknown>; throws?: undefined }
  | { throws: { message: string }; expected?: undefined }
);

describe('withMicrofrontends: transpilePackages', () => {
  const testCases: TestCase[] = [
    {
      description: 'should add transpilePackages when it does not exist',
      input: {
        next: {},
        app: {
          name: 'vercel-marketing',
        },
      },
      expected: {
        next: {
          transpilePackages: ['@vercel/microfrontends'],
        },
      },
    },
    {
      description: 'should merge transpilePackages when it already exists',
      input: {
        next: {
          transpilePackages: ['foo'],
        },
        app: {
          name: 'vercel-marketing',
        },
      },
      expected: {
        next: {
          transpilePackages: ['foo', '@vercel/microfrontends'],
        },
      },
    },
  ];

  test.each<TestCase>(testCases)('$description', ({
    input,
    expected,
    throws,
  }) => {
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });
    const config = microfrontends.config;
    const app = config.getApplication(input.app.name);

    if (throws) {
      expect(() =>
        transform({
          next: input.next,
          app,
          microfrontend: config,
        }),
      ).toThrow(throws.message);
    } else {
      const result = transform({
        next: input.next,
        app,
        microfrontend: config,
      });

      expect(result).toEqual(expected);
    }
  });
});
