import { join } from 'node:path';
import type { NextConfig } from 'next';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { transform } from './redirects';

const OLD_ENV = process.env;

const fixtures = fileURLToPath(
  new URL('../../../config/__fixtures__', import.meta.url),
);

describe('withMicrofrontends: redirects', () => {
  describe('local proxy running', () => {
    beforeEach(() => {
      process.env = { ...OLD_ENV };
      process.env.TURBO_TASK_HAS_MFE_PROXY = '1';
    });

    it('redirects when enabled non-prod', async () => {
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {};

      const app = mfConfig.getDefaultApplication();

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
        opts: { isProduction: false },
      });

      expect(newConfig.redirects).toBeDefined();
      const redirects = newConfig.redirects
        ? await newConfig.redirects()
        : undefined;
      expect(redirects).toEqual([
        {
          source: '/:path*',
          destination: 'http://localhost:3324/:path*',
          permanent: false,
          missing: [{ type: 'header', key: 'x-vercel-mfe-local-proxy-origin' }],
          has: [{ type: 'header', key: 'host' }],
        },
      ]);
    });

    it('redirects when enabled non-prod child app', async () => {
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {};

      const app = mfConfig.getApplication('vercel-marketing');

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
        opts: { isProduction: false },
      });

      expect(newConfig.redirects).toBeDefined();
      const redirects = newConfig.redirects
        ? await newConfig.redirects()
        : undefined;
      expect(redirects).toEqual([
        {
          source: '/:path*',
          destination: 'http://localhost:3324/:path*',
          permanent: false,
          missing: [{ type: 'header', key: 'x-vercel-mfe-local-proxy-origin' }],
          has: [{ type: 'header', key: 'host' }],
        },
      ]);
    });

    it('preserves existing redirects', async () => {
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {
        // eslint-disable-next-line @typescript-eslint/require-await
        redirects: async () => [
          {
            source: '/blog/alpha',
            destination: '/legacy/blog',
            permanent: true,
          },
        ],
      };

      const app = mfConfig.getDefaultApplication();

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
        opts: { isProduction: false },
      });

      expect(newConfig.redirects).toBeDefined();
      const redirects = newConfig.redirects
        ? await newConfig.redirects()
        : undefined;
      expect(redirects).toEqual([
        {
          source: '/:path*',
          destination: 'http://localhost:3324/:path*',
          permanent: false,
          missing: [{ type: 'header', key: 'x-vercel-mfe-local-proxy-origin' }],
          has: [{ type: 'header', key: 'host' }],
        },
        {
          source: '/blog/alpha',
          destination: '/legacy/blog',
          permanent: true,
        },
      ]);
    });

    it('no redirects prod', () => {
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {};

      const app = mfConfig.getDefaultApplication();

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
        opts: { isProduction: true },
      });

      expect(newConfig.redirects).toBeUndefined();
    });

    it('no redirects if disabled', () => {
      process.env.MFE_DISABLE_LOCAL_PROXY_REWRITE = '1';
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {};

      const app = mfConfig.getDefaultApplication();

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
      });

      expect(newConfig.redirects).toBeUndefined();
    });

    it('no redirects if non dev env', () => {
      process.env.TURBO_TASK_HAS_MFE_PROXY = undefined;
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {};

      const app = mfConfig.getDefaultApplication();

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
      });

      expect(newConfig.redirects).toBeUndefined();
    });

    it('redirects if turbo is running mfe proxy', async () => {
      process.env.TURBO_TASK_HAS_MFE_PROXY = '1';
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {};

      const app = mfConfig.getDefaultApplication();

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
      });

      expect(newConfig.redirects).toBeDefined();
      const redirects = newConfig.redirects
        ? await newConfig.redirects()
        : undefined;
      expect(redirects).toEqual([
        {
          source: '/:path*',
          destination: 'http://localhost:3324/:path*',
          permanent: false,
          missing: [{ type: 'header', key: 'x-vercel-mfe-local-proxy-origin' }],
          has: [{ type: 'header', key: 'host' }],
        },
      ]);
    });
  });

  describe('no local proxy running', () => {
    beforeEach(() => {
      process.env = { ...OLD_ENV };
    });

    it('has no redirects', () => {
      const mfConfig = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      }).config;

      const nextConfig: NextConfig = {};

      const app = mfConfig.getDefaultApplication();

      const { next: newConfig } = transform({
        next: nextConfig,
        app,
        microfrontend: mfConfig,
        opts: { isProduction: false },
      });

      expect(newConfig.redirects).toBeUndefined();
    });
  });
});
