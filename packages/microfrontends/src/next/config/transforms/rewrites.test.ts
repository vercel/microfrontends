import { join } from 'node:path';
import type { NextConfig } from 'next';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { generateAssetPrefixFromName } from '../../../config/microfrontends-config/isomorphic/utils/generate-asset-prefix';
import { transform } from './rewrites';

const OLD_ENV = process.env;

const fixtures = fileURLToPath(
  new URL('../../../config/__fixtures__', import.meta.url),
);

const docsAssetPrefix = generateAssetPrefixFromName({
  name: 'docs',
});

describe('withMicrofrontends: rewrites', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('handles next config without any rewrites', async () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {
      env: {
        MY_ENV_VAR: 'test',
      },
    };
    // get the default app
    const app = mfConfig.getDefaultApplication();

    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.env).toEqual({
      MY_ENV_VAR: 'test',
    });
    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(rewrites).toMatchObject({
      afterFiles: [],
      beforeFiles: [],
      fallback: [],
    });
  });
  it('handles next config with rewrites array', async () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {
      env: {
        MY_ENV_VAR: 'test',
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      rewrites: async () => [
        {
          source: '/test',
          destination: '/test',
        },
      ],
    };
    // get the default app
    const app = mfConfig.getDefaultApplication();

    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.env).toEqual({
      MY_ENV_VAR: 'test',
    });
    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(rewrites).toMatchObject({
      afterFiles: [
        {
          source: '/test',
          destination: '/test',
        },
      ],
      beforeFiles: [],
      fallback: [],
    });
  });
  it('handles next config with rewrites object', async () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {
      env: {
        MY_ENV_VAR: 'test',
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      rewrites: async () => ({
        afterFiles: [
          {
            source: '/after-test',
            destination: '/after-test-destination',
          },
        ],
        beforeFiles: [
          {
            source: '/before-test',
            destination: '/before-test-destination',
          },
        ],
        fallback: [
          {
            source: '/fallback-test',
            destination: '/fallback-test-destination',
          },
        ],
      }),
    };
    // get the default app
    const app = mfConfig.getDefaultApplication();

    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.env).toEqual({
      MY_ENV_VAR: 'test',
    });
    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(rewrites).toMatchObject({
      afterFiles: [
        {
          source: '/after-test',
          destination: '/after-test-destination',
        },
      ],
      beforeFiles: [
        {
          source: '/before-test',
          destination: '/before-test-destination',
        },
      ],
      fallback: [
        {
          source: '/fallback-test',
          destination: '/fallback-test-destination',
        },
      ],
    });
  });
  it('handles next config with rewrites function that has side effects', async () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const aFunc = jest.fn();
    const nextConfig: NextConfig = {
      env: {
        MY_ENV_VAR: 'test',
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      rewrites: async () => {
        aFunc();
        return {
          afterFiles: [
            {
              source: '/after-test',
              destination: '/after-test-destination',
            },
          ],
          beforeFiles: [
            {
              source: '/before-test',
              destination: '/before-test-destination',
            },
          ],
          fallback: [
            {
              source: '/fallback-test',
              destination: '/fallback-test-destination',
            },
          ],
        };
      },
    };
    // get the default app
    const app = mfConfig.getDefaultApplication();

    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.env).toEqual({
      MY_ENV_VAR: 'test',
    });
    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(aFunc).toHaveBeenCalledTimes(1);
    expect(rewrites).toMatchObject({
      afterFiles: [
        {
          source: '/after-test',
          destination: '/after-test-destination',
        },
      ],
      beforeFiles: [
        {
          source: '/before-test',
          destination: '/before-test-destination',
        },
      ],
      fallback: [
        {
          source: '/fallback-test',
          destination: '/fallback-test-destination',
        },
      ],
    });
  });
  it('adds correct rewrites if the app is not the default', async () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {
      env: {
        MY_ENV_VAR: 'test',
      },
    };
    // get the default app
    const app = mfConfig.getApplication('docs');
    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.env).toEqual({
      MY_ENV_VAR: 'test',
    });
    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(rewrites).toMatchObject({
      beforeFiles: [
        {
          destination: '/_next/:path+',
          source: '/vc-ap-e3e2a9/_next/:path+',
        },
        {
          destination: '/.well-known/vercel/flags',
          source: `/${docsAssetPrefix}/.well-known/vercel/flags`,
        },
        {
          destination: '/.well-known/vercel/rate-limit-api/:path*',
          source: `/${docsAssetPrefix}/.well-known/vercel/rate-limit-api/:path*`,
        },
        {
          destination: '/_vercel/:path*',
          source: `/${docsAssetPrefix}/_vercel/:path*`,
        },
      ],
    });
  });
  it('adds correct rewrites if the app is not the default and speed insights are consolidated', async () => {
    process.env.VERCEL_MICROFRONTENDS_CONSOLIDATE_SPEED_INSIGHTS = '1';
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {
      env: {
        MY_ENV_VAR: 'test',
      },
    };
    // get the default app
    const app = mfConfig.getApplication('docs');
    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.env).toEqual({
      MY_ENV_VAR: 'test',
    });
    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(rewrites).toMatchObject({
      beforeFiles: [
        {
          destination: '/_next/:path+',
          source: '/vc-ap-e3e2a9/_next/:path+',
        },
        {
          destination: '/.well-known/vercel/flags',
          source: `/${docsAssetPrefix}/.well-known/vercel/flags`,
        },
        {
          destination: '/.well-known/vercel/rate-limit-api/:path*',
          source: `/${docsAssetPrefix}/.well-known/vercel/rate-limit-api/:path*`,
        },
        {
          destination: '/_vercel/:path*',
          source: `/${docsAssetPrefix}/_vercel/:path*`,
        },
      ],
    });
  });
  it('handles empty next config', async () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {};
    // get the default app
    const app = mfConfig.getDefaultApplication();

    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(rewrites).toMatchObject({
      afterFiles: [],
      beforeFiles: [],
      fallback: [],
    });
  });
  it('does not make changes if not in production', () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {};
    // get the default app
    const app = mfConfig.getDefaultApplication();

    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: {
        isProduction: false,
      },
    });

    expect(newConfig).toMatchObject({});
  });

  it('adds correct rewrites when app has custom assetPrefix', async () => {
    const mfConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;

    const nextConfig: NextConfig = {};

    // get a non-default app and set custom asset prefix
    const app = mfConfig.getApplication('docs');
    // @ts-expect-error - this is the child application
    app.serialized.assetPrefix = 'custom-prefix';

    const { next: newConfig } = transform({
      next: nextConfig,
      app,
      microfrontend: mfConfig,
      opts: { isProduction: true },
    });

    expect(newConfig.rewrites).toBeDefined();
    const rewrites = newConfig.rewrites
      ? await newConfig.rewrites()
      : undefined;
    expect(rewrites).toMatchObject({
      beforeFiles: [
        {
          destination: '/_next/:path+',
          source: '/custom-prefix/_next/:path+',
        },
        {
          destination: '/.well-known/vercel/flags',
          source: '/custom-prefix/.well-known/vercel/flags',
        },
        {
          destination: '/.well-known/vercel/rate-limit-api/:path*',
          source: '/custom-prefix/.well-known/vercel/rate-limit-api/:path*',
        },
        {
          destination: '/_vercel/:path*',
          source: '/custom-prefix/_vercel/:path*',
        },
      ],
    });
  });
});
