import { join } from 'node:path';
import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { transform } from './asset-prefix';

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

describe('withMicrofrontends: assetPrefix', () => {
  const testCases: TestCase[] = [
    {
      description: 'should add assetPrefix when it does not exist',
      input: {
        next: {},
        app: {
          name: 'vercel-marketing',
        },
      },
      expected: {
        next: {
          assetPrefix: '/vc-ap-6a379c',
          images: {
            path: '/vc-ap-6a379c/_next/image',
          },
        },
      },
    },
    {
      description:
        'should allow assetPrefix to already be set to the computed value',
      input: {
        next: {
          assetPrefix: '/vc-ap-6a379c',
        },
        app: {
          name: 'vercel-marketing',
        },
      },
      expected: {
        next: {
          assetPrefix: '/vc-ap-6a379c',
          images: {
            path: '/vc-ap-6a379c/_next/image',
          },
        },
      },
    },
    {
      description: 'should not add assetPrefix for default application',
      input: {
        next: {},
        app: {
          name: 'vercel-site',
        },
      },
      expected: {
        next: {},
      },
    },
    {
      description:
        'should throw if assetPrefix is already set to a custom value',
      input: {
        next: {
          assetPrefix: '/some-value',
        },
        app: {
          name: 'vercel-marketing',
        },
      },
      throws: {
        message:
          '"assetPrefix" already set and does not equal "/vc-ap-6a379c". Either omit the assetPrefix in your next config, or set it to "/vc-ap-6a379c".',
      },
    },
    {
      description:
        'should add assetPrefix to existing next config without overwriting other vars',
      input: {
        next: {
          env: {
            EXISTING_VAR: 'value',
          },
        },
        app: {
          name: 'vercel-marketing',
        },
      },
      expected: {
        next: {
          assetPrefix: '/vc-ap-6a379c',
          env: {
            EXISTING_VAR: 'value',
          },
          images: {
            path: '/vc-ap-6a379c/_next/image',
          },
        },
      },
    },
    {
      description: 'should preserve existing images config and add path',
      input: {
        next: {
          images: {
            domains: ['example.com'],
            deviceSizes: [640, 750, 828],
          },
        },
        app: {
          name: 'vercel-marketing',
        },
      },
      expected: {
        next: {
          assetPrefix: '/vc-ap-6a379c',
          images: {
            domains: ['example.com'],
            deviceSizes: [640, 750, 828],
            path: '/vc-ap-6a379c/_next/image',
          },
        },
      },
    },
    {
      description: 'should override existing images path if already set',
      input: {
        next: {
          images: {
            path: '/custom/image/path',
            domains: ['example.com'],
          },
        },
        app: {
          name: 'vercel-marketing',
        },
      },
      expected: {
        next: {
          assetPrefix: '/vc-ap-6a379c',
          images: {
            path: '/vc-ap-6a379c/_next/image',
            domains: ['example.com'],
          },
        },
      },
    },
    {
      description: 'should not modify images config for default application',
      input: {
        next: {
          images: {
            domains: ['example.com'],
            path: '/custom/path',
          },
        },
        app: {
          name: 'vercel-site',
        },
      },
      expected: {
        next: {
          images: {
            domains: ['example.com'],
            path: '/custom/path',
          },
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

  test('should use custom assetPrefix when specified in application config', () => {
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });
    const config = microfrontends.config;
    const app = config.getApplication('vercel-marketing');
    // @ts-expect-error - this is the child application
    app.serialized.assetPrefix = 'custom-prefix';

    const result = transform({
      next: {},
      app,
      microfrontend: config,
    });

    expect(result).toEqual({
      next: {
        assetPrefix: '/custom-prefix',
        images: {
          path: '/custom-prefix/_next/image',
        },
      },
    });
  });
});
