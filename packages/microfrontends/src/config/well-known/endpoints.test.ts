import { join } from 'node:path';
import { fileURLToPath } from '../../test-utils/file-url-to-path';
import { MicrofrontendsServer } from '../microfrontends/server';
import { getWellKnownClientData } from './endpoints';

const OLD_ENV = process.env;
const fixtures = fileURLToPath(new URL('../__fixtures__', import.meta.url));

describe('well-known endpoints', () => {
  let testIsomorphicConfig = MicrofrontendsServer.fromFile({
    filePath: join(fixtures, 'simple.jsonc'),
  }).config;

  beforeEach(() => {
    process.env = OLD_ENV;
    testIsomorphicConfig = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    }).config;
  });

  describe('getWellKnownClientData', () => {
    it('returns condensed client configuration when all flags are true', async () => {
      const config = await getWellKnownClientData(testIsomorphicConfig, {
        'new-feature-flag': () => Promise.resolve(true),
      });
      expect(config.config).toEqual({
        applications: {
          '2d9dc9': { default: true },
          c09897: { default: false, routing: [] },
          e3e2a9: { default: false, routing: [] },
          b3331f: {
            default: false,
            routing: [{ paths: ['/design/:path*', '/geist/:path*'] }],
          },
          '6a379c': {
            default: false,
            routing: [
              {
                paths: [
                  '/blog',
                  '/blog/:slug*',
                  '/press',
                  '/changelog',
                  '/changelog/:slug*',
                  '/customers/:slug*',
                  '/',
                  '/contact',
                  '/home',
                  '/pricing',
                  '/enterprise',
                  '/customers',
                  '/solutions/platform-engineering',
                  '/solutions/design-engineering',
                  '/ai',
                  '/solutions/composable-commerce',
                  '/solutions/marketing-sites',
                  '/solutions/multi-tenant-saas',
                  '/solutions/web-apps',
                  '/products/previews',
                  '/products/rendering',
                  '/products/observability',
                  '/security',
                  '/frameworks/nextjs',
                  '/roi',
                  '/contact/sales',
                  '/contact/sales/:slug*',
                  '/try-enterprise',
                  '/solutions/composable-commerce/migration',
                ],
              },
            ],
          },
          '543c6b': {
            default: false,
            routing: [
              {
                paths: [
                  '/new-feature-2/:slug*',
                  '/new-feature-1/:slug*',
                  '/new-feature-3/:slug*',
                ],
              },
            ],
          },
        },
        hasFlaggedPaths: true,
      });
    });

    it('excludes flagged paths when flag evaluates to false', async () => {
      const config = await getWellKnownClientData(testIsomorphicConfig, {
        'new-feature-flag': () => Promise.resolve(false),
      });
      expect(config.config).toEqual({
        applications: {
          '2d9dc9': { default: true },
          c09897: { default: false, routing: [] },
          e3e2a9: { default: false, routing: [] },
          b3331f: {
            default: false,
            routing: [{ paths: ['/design/:path*', '/geist/:path*'] }],
          },
          '6a379c': {
            default: false,
            routing: [
              {
                paths: [
                  '/blog',
                  '/blog/:slug*',
                  '/press',
                  '/changelog',
                  '/changelog/:slug*',
                  '/customers/:slug*',
                  '/',
                  '/contact',
                  '/home',
                  '/pricing',
                  '/enterprise',
                  '/customers',
                  '/solutions/platform-engineering',
                  '/solutions/design-engineering',
                  '/ai',
                  '/solutions/composable-commerce',
                  '/solutions/marketing-sites',
                  '/solutions/multi-tenant-saas',
                  '/solutions/web-apps',
                  '/products/previews',
                  '/products/rendering',
                  '/products/observability',
                  '/security',
                  '/frameworks/nextjs',
                  '/roi',
                  '/contact/sales',
                  '/contact/sales/:slug*',
                  '/try-enterprise',
                  '/solutions/composable-commerce/migration',
                ],
              },
            ],
          },
          '543c6b': {
            default: false,
            routing: [
              {
                paths: ['/new-feature-1/:slug*', '/new-feature-3/:slug*'],
              },
            ],
          },
        },
        hasFlaggedPaths: true,
      });
    });

    it('throws error when flags are not provided', async () => {
      await expect(
        getWellKnownClientData(testIsomorphicConfig),
      ).rejects.toThrow(
        'Flag "new-feature-flag" was specified to control routing',
      );
    });
  });
});
