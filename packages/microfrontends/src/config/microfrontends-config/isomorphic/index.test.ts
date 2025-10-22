/* @jest-environment node */

import fs from 'node:fs';
import { join } from 'node:path';
import { parse } from 'jsonc-parser';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import type { Config } from '../../schema/types';
import { hashApplicationName } from './utils/hash-application-name';
import { MicrofrontendConfigIsomorphic } from '.';

const fixtures = fileURLToPath(new URL('../../__fixtures__', import.meta.url));

describe('class MicrofrontendConfigIsomorphic', () => {
  describe('getters', () => {
    it('gets the default application', () => {
      const config = parse(
        fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
      ) as Config;
      const result = new MicrofrontendConfigIsomorphic({
        config,
      });
      expect(result.getDefaultApplication().name).toBe('vercel-site');
    });

    it('gets application by name', () => {
      const config = parse(
        fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
      ) as Config;
      const result = new MicrofrontendConfigIsomorphic({
        config,
      });

      expect(result.getApplicationByProjectName('not-a-name')).toBeUndefined();
      const vercelSite = result.getApplicationByProjectName('vercel-site');
      expect(vercelSite).toBeDefined();
      expect(vercelSite).toHaveProperty('name', 'vercel-site');
    });

    it('gets the local proxy port', () => {
      const config = parse(
        fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
      ) as Config;
      const result = new MicrofrontendConfigIsomorphic({
        config,
      });
      expect(result.getLocalProxyPort()).toBe(3324);
    });
  });

  describe('toSchemaJson', () => {
    it('convert to json correctly', () => {
      const config = parse(
        fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
      ) as Config;
      const originalConfig = new MicrofrontendConfigIsomorphic({
        config,
        overrides: {
          applications: {
            'vercel-site': { environment: { host: 'example.com' } },
            'vercel-marketing': {
              environment: {
                host: 'example-marketing.com',
              },
            },
          },
        },
      });
      const serialized = originalConfig.toSchemaJson();
      expect(serialized).toEqual(originalConfig.config);
    });
  });

  describe('client config', () => {
    it('converts to client config correctly', () => {
      const config = parse(
        fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
      ) as Config;
      const originalConfig = new MicrofrontendConfigIsomorphic({
        config,
      });
      const client = originalConfig.toClientConfig();
      expect(client.applications).toEqual({
        [hashApplicationName('vercel-site')]: { default: true },
        [hashApplicationName('vercel-marketing')]: {
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
        [hashApplicationName('geist-docs')]: {
          default: false,
          routing: [{ paths: ['/design/:path*', '/geist/:path*'] }],
        },
        [hashApplicationName('docs')]: { default: false, routing: [] },
        [hashApplicationName('nextjs-conf')]: {
          default: false,
          routing: [],
        },
        [hashApplicationName('other-app')]: {
          default: false,
          routing: [
            {
              paths: ['/new-feature-2/:slug*'],
              flag: 'new-feature-flag',
            },
            { paths: ['/new-feature-1/:slug*', '/new-feature-3/:slug*'] },
          ],
        },
      });
    });
  });

  describe('serialize', () => {
    it('serializes the config correctly', () => {
      const config = parse(
        fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
      ) as Config;
      const originalConfig = new MicrofrontendConfigIsomorphic({
        config,
        overrides: {
          applications: {
            'vercel-site': { environment: { host: 'example.com' } },
            'vercel-marketing': {
              environment: {
                host: 'example-marketing.com',
              },
            },
          },
        },
      });
      const serialized = originalConfig.serialize();
      const configFromSerialized = new MicrofrontendConfigIsomorphic({
        config: serialized.config,
        overrides: serialized.overrides,
      });
      expect(configFromSerialized).toEqual(originalConfig);
    });
  });

  describe('validation', () => {
    it('throw if the default application is missing', () => {
      const config = {
        version: '1' as const,
        provider: 'vercel' as const,
        applications: {
          default: {
            routing: [
              {
                paths: ['/path'],
              },
            ],
          },
          alternate: {
            routing: [
              {
                paths: ['/another-path'],
              },
            ],
          },
        },
      };

      expect(
        () =>
          new MicrofrontendConfigIsomorphic({
            config,
          }),
      ).toThrow();
    });

    it('throw if the version is incorrect', () => {
      const config = {
        version: '3',
        provider: 'vercel',
        applications: {
          default: {
            routing: [
              {
                paths: ['/path'],
              },
            ],
          },
          alternate: {
            routing: [
              {
                paths: ['/another-path'],
              },
            ],
          },
        },
      } as unknown as Config;
      expect(
        () =>
          new MicrofrontendConfigIsomorphic({
            config,
          }),
      ).toThrow();
    });

    it('passes deprecation validation on okay config', () => {
      const config = {
        applications: {
          default: {},
          alternate: {
            routing: [
              {
                paths: ['/another-path'],
              },
            ],
          },
        },
      } as unknown as Config;
      expect(() =>
        MicrofrontendConfigIsomorphic.validate(config),
      ).not.toThrow();
    });
  });
});
