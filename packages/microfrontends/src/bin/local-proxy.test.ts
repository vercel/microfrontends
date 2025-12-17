import fs from 'node:fs';
import { join } from 'node:path';
import { parse } from 'jsonc-parser';
import { MicrofrontendConfigIsomorphic } from '../config/microfrontends-config/isomorphic';
import { Host } from '../config/microfrontends-config/isomorphic/host';
import { generateAssetPrefixFromName } from '../config/microfrontends-config/isomorphic/utils/generate-asset-prefix';
import { OVERRIDES_ENV_COOKIE_PREFIX } from '../config/overrides/constants';
import type { Config } from '../config/schema/types';
import { fileURLToPath } from '../test-utils/file-url-to-path';
import { LocalProxy, ProxyRequestRouter } from './local-proxy';

const fixtures = fileURLToPath(
  new URL('../config/__fixtures__', import.meta.url),
);

function simpleConfig(): MicrofrontendConfigIsomorphic {
  return new MicrofrontendConfigIsomorphic({
    config: parse(
      fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
    ) as Config,
  });
}

describe('class ProxyRequestRouter', () => {
  describe('getDefaultHost', () => {
    it('use local if available', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site'],
      });
      expect(router.getDefaultHost(config)).toMatchObject({
        application: 'vercel-site',
        url: new URL('http://localhost:3331/'),
        protocol: 'http',
        hostname: 'localhost',
        port: 3331,
      });
    });

    it('use fallback if not running locally', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: [],
      });
      expect(router.getDefaultHost(config)).toMatchObject({
        application: 'vercel-site',
        url: new URL('https://vercel.com/'),
        protocol: 'https',
        hostname: 'vercel.com',
      });
    });
  });

  describe('getApplicationTarget', () => {
    it('uses fallback if child has no production', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      expect(
        router.getApplicationTarget(config.getApplication('other-app')),
      ).toMatchObject({
        application: 'vercel-site',
        url: new URL('https://vercel.com'),
        protocol: 'https',
        hostname: 'vercel.com',
      });
    });

    it('respects host overrides', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      const vercelMarketing = config.getApplication('vercel-marketing');
      vercelMarketing.overrides = {
        environment: new Host({
          host: 'marketing-beta.vercel.com',
        }),
      };
      expect(router.getApplicationTarget(vercelMarketing)).toMatchObject({
        application: 'vercel-marketing',
        url: new URL('https://marketing-beta.vercel.com/'),
        protocol: 'https',
        hostname: 'marketing-beta.vercel.com',
      });
    });
  });

  describe('getTarget', () => {
    it('routes unrecognized paths to default fallback', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      expect(
        router.getTarget({
          url: '/a-path-that-surely-does-not-match-any-routes',
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-site',
        url: new URL('https://vercel.com/'),
        protocol: 'https',
        hostname: 'vercel.com',
      });
    });

    it('respects cookie overrides', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      expect(
        router.getTarget({
          url: '/',
          headers: {
            cookie: `${OVERRIDES_ENV_COOKIE_PREFIX}vercel-marketing=override-mkt.vercel.com`,
          },
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        url: new URL('https://override-mkt.vercel.com/'),
        protocol: 'https',
        hostname: 'override-mkt.vercel.com',
      });
    });

    it('redirects sso requests', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      expect(
        router.getTarget({
          url: '/sso-api',
          headers: {},
        }),
      ).toMatchObject({
        protocol: 'https',
        hostname: 'vercel.com',
        port: 443,
        path: '/sso-api',
      });
    });

    it('redirects jwt requests', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      expect(
        router.getTarget({
          url: '/blog?_vercel_jwt=1&_host_override=example.com',
          headers: {},
        }),
      ).toMatchObject({
        protocol: 'https',
        hostname: 'example.com',
        port: 443,
        path: '/blog?_vercel_jwt=1',
      });
    });

    it('redirects auth requests', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      expect(
        router.getTarget({
          url: '/.well-known/vercel-auth-redirect?_host_override=example.com',
          headers: {},
        }),
      ).toMatchObject({
        protocol: 'https',
        hostname: 'example.com',
        port: 443,
        path: '/.well-known/vercel-auth-redirect?_host_override=example.com',
      });
    });

    it('redirects assets with prefix', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      const assetPrefix = generateAssetPrefixFromName({ name: 'docs' });
      expect(
        router.getTarget({
          url: `/${assetPrefix}/_next/static/asset.txt`,
          headers: {},
        }),
      ).toMatchObject({
        application: 'docs',
        protocol: 'http',
        hostname: 'localhost',
        port: 3334,
        path: `/${assetPrefix}/_next/static/asset.txt`,
      });
    });

    it('redirect assets with prefix to production child', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      const assetPrefix = generateAssetPrefixFromName({
        name: 'vercel-marketing',
      });
      expect(
        router.getTarget({
          url: `/${assetPrefix}/_next/static/asset.txt`,
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        protocol: 'https',
        hostname: 'marketing.vercel.com',
        path: `/${assetPrefix}/_next/static/asset.txt`,
      });
    });

    it('redirect assets with prefix to default fallback', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      expect(
        router.getTarget({
          url: `/${generateAssetPrefixFromName({ name: 'other-app' })}/_next/static/asset.txt`,
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-site',
        protocol: 'https',
        hostname: 'vercel.com',
        path: `/${generateAssetPrefixFromName({ name: 'other-app' })}/_next/static/asset.txt`,
      });
    });

    it('redirect assets with custom prefix to matching application', () => {
      const config = simpleConfig();
      const otherApp = config.getApplication('vercel-marketing');
      // @ts-expect-error - this is the child application
      otherApp.serialized.assetPrefix = 'custom-asset-prefix';
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      expect(
        router.getTarget({
          url: '/custom-asset-prefix/_next/static/asset.txt',
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        protocol: 'https',
        hostname: 'marketing.vercel.com',
        path: '/custom-asset-prefix/_next/static/asset.txt',
      });
    });

    it('still redirects project name and hashed project name asset prefix to matching application with custom asset prefix', () => {
      const config = simpleConfig();
      const otherApp = config.getApplication('vercel-marketing');
      // @ts-expect-error - this is the child application
      otherApp.serialized.assetPrefix = 'custom-asset-prefix';
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      const assetPrefix = generateAssetPrefixFromName({
        name: 'vercel-marketing',
      });
      expect(
        router.getTarget({
          url: `/${assetPrefix}/_next/static/asset.txt`,
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        protocol: 'https',
        hostname: 'marketing.vercel.com',
        path: `/${assetPrefix}/_next/static/asset.txt`,
      });
      expect(
        router.getTarget({
          url: '/vc-ap-vercel-marketing/_next/static/asset.txt',
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        protocol: 'https',
        hostname: 'marketing.vercel.com',
        path: '/vc-ap-vercel-marketing/_next/static/asset.txt',
      });
    });

    it('redirects flags', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      const assetPrefix = generateAssetPrefixFromName({ name: 'docs' });
      expect(
        router.getTarget({
          url: `/${assetPrefix}/.well-known/vercel/flags`,
          headers: {},
        }),
      ).toMatchObject({
        application: 'docs',
        protocol: 'http',
        hostname: 'localhost',
        port: 3334,
        path: `/${assetPrefix}/.well-known/vercel/flags`,
      });
    });

    it('redirects o11y', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      const assetPrefix = generateAssetPrefixFromName({ name: 'docs' });
      expect(
        router.getTarget({
          url: `/${assetPrefix}/_vercel/path`,
          headers: {},
        }),
      ).toMatchObject({
        application: 'docs',
        protocol: 'http',
        hostname: 'localhost',
        port: 3334,
        path: `/${assetPrefix}/_vercel/path`,
      });
    });

    it('redirects o11y with query', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'docs'],
      });
      const assetPrefix = generateAssetPrefixFromName({ name: 'docs' });
      expect(
        router.getTarget({
          url: `/${assetPrefix}/_vercel/path?k=v`,
          headers: {},
        }),
      ).toMatchObject({
        application: 'docs',
        protocol: 'http',
        hostname: 'localhost',
        port: 3334,
        path: `/${assetPrefix}/_vercel/path?k=v`,
      });
    });

    it('redirects next stack frame to source application', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-marketing'],
      });
      const url =
        '/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true';
      expect(
        router.getTarget({
          url,
          headers: {
            referer: 'http://localhost:3024/blog/',
          },
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        protocol: 'http',
        hostname: 'localhost',
        port: 5984,
        path: url,
      });
    });

    it('redirects next source map to locally running application', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-marketing'],
      });
      const url = '/__nextjs_source-map?filename=%2Fpath%2Fto%2Fapp.js';
      expect(
        router.getTarget({
          url,
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        protocol: 'http',
        hostname: 'localhost',
        port: 5984,
        path: url,
      });
    });

    it('redirects next image to matching application', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-marketing'],
      });
      const url = '/_next/image?url=%2Fblog%2Fimage.png&w=64&q=75';
      expect(
        router.getTarget({
          url,
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-marketing',
        protocol: 'http',
        hostname: 'localhost',
        port: 5984,
        path: url,
      });
    });

    it('redirects next image with asset prefix to matching application', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['docs'],
      });
      const assetPrefix = generateAssetPrefixFromName({ name: 'docs' });
      const url = `/_next/image?url=%2F${assetPrefix}%2F_next%2Fstatic%2Fmedia%2Ficon.png&w=64&q=75`;
      expect(
        router.getTarget({
          url,
          headers: {},
        }),
      ).toMatchObject({
        application: 'docs',
        protocol: 'http',
        hostname: 'localhost',
        port: 3334,
        path: url,
      });
    });

    it('redirects next image to default app when no matching route', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site'],
      });
      const url = '/_next/image?url=%2Funknown%2Fpath%2Fimage.png&w=64&q=75';
      expect(
        router.getTarget({
          url,
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-site',
        protocol: 'http',
        hostname: 'localhost',
        port: 3331,
        path: url,
      });
    });

    it('redirects flagged routes to default app', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['other-app', 'vercel-site'],
      });
      const url = '/new-feature-2/test';
      expect(
        router.getTarget({
          url,
          headers: {},
        }),
      ).toMatchObject({
        application: 'vercel-site',
        protocol: 'http',
        hostname: 'localhost',
        port: 3331,
        path: url,
      });
    });

    it('routes middleware rewrites to target app', () => {
      const config = simpleConfig();
      const router = new ProxyRequestRouter(config, {
        localApps: ['vercel-site', 'other-app'],
      });
      const url = '/new-feature-2/test';
      expect(
        router.getTarget({
          url,
          headers: {
            'x-vercel-mfe-zone': 'other-app',
          },
        }),
      ).toMatchObject({
        application: 'other-app',
        protocol: 'http',
        hostname: 'localhost',
        port: 6476,
        path: url,
      });
    });
  });

  it('routes middleware rewrites to target app regardless of route match', () => {
    const config = simpleConfig();
    const router = new ProxyRequestRouter(config, {
      localApps: ['vercel-site', 'other-app'],
    });
    const url = '/new-feature-2/test';
    expect(
      router.getTarget({
        url,
        headers: {
          'x-vercel-mfe-zone': 'docs',
        },
      }),
    ).toMatchObject({
      application: 'docs',
      protocol: 'https',
      hostname: 'docs.vercel.com',
      path: url,
    });
  });

  it('routes to default if middleware return invalid zone', () => {
    const mockedError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const config = simpleConfig();
    const router = new ProxyRequestRouter(config, {
      localApps: ['vercel-site'],
    });
    const url = '/new-feature-2/test';
    expect(
      router.getTarget({
        url,
        headers: {
          'x-vercel-mfe-zone': 'd0cs',
        },
      }),
    ).toMatchObject({
      application: 'vercel-site',
      protocol: 'http',
      hostname: 'localhost',
      port: 3331,
      path: url,
    });
    expect(mockedError).toHaveBeenCalled();
    mockedError.mockReset();
  });

  it('warns if checking production middleware', () => {
    const mockedError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const config = simpleConfig();
    const router = new ProxyRequestRouter(config, {
      localApps: ['other-app'],
    });
    const url = '/new-feature-2/test';
    expect(
      router.getTarget({
        url,
        headers: {},
      }),
    ).toMatchObject({
      application: 'vercel-site',
      protocol: 'https',
      hostname: 'vercel.com',
      path: url,
    });
    expect(mockedError).toHaveBeenCalled();
    mockedError.mockReset();
  });

  it('uses flagged path if mfe-flag-value is true', () => {
    const config = simpleConfig();
    const router = new ProxyRequestRouter(config, {
      localApps: ['other-app'],
    });
    const url = '/new-feature-2/test';
    const query = '?vercel-mfe-flag-value=true';
    expect(
      router.getTarget({
        url: `${url}${query}`,
        headers: {},
      }),
    ).toMatchObject({
      application: 'other-app',
      protocol: 'http',
      hostname: 'localhost',
      port: 6476,
      path: url,
    });
  });

  it('does not use flagged path if mfe-flag-value is false', () => {
    const config = simpleConfig();
    const router = new ProxyRequestRouter(config, {
      localApps: ['other-app'],
    });
    const url = '/new-feature-2/test';
    const query = '?vercel-mfe-flag-value=false';
    expect(
      router.getTarget({
        url: `${url}${query}`,
        headers: {},
      }),
    ).toMatchObject({
      application: 'vercel-site',
      protocol: 'https',
      hostname: 'vercel.com',
      path: url,
    });
  });
});

describe('class LocalProxy', () => {
  describe('fromFile', () => {
    it('should fail on invalid config filename', () => {
      expect(() => {
        LocalProxy.fromFile('non-existent.json', { localApps: [] });
      }).toThrow(
        new Error(
          "ENOENT: no such file or directory, open 'non-existent.json'",
        ),
      );
    });

    it('should load direct filename without inference', () => {
      const config = LocalProxy.fromFile(join(fixtures, 'simple.jsonc'), {
        localApps: [],
      });
      expect(
        config.router.config
          .getAllApplications()
          .map((application) => application.name),
      ).toEqual([
        'vercel-site',
        'vercel-marketing',
        'geist-docs',
        'docs',
        'nextjs-conf',
        'other-app',
      ]);
    });

    it('should infer config file', () => {
      const config = LocalProxy.fromFile(undefined, {
        localApps: [],
      });
      expect(
        config.router.config
          .getAllApplications()
          .map((application) => application.name),
      ).toEqual(['@vercel/microfrontends', 'some-other-app']);
    });

    it('should throw on bad app name', () => {
      expect(() =>
        LocalProxy.fromFile(join(fixtures, 'simple.jsonc'), {
          localApps: ['vercel-site', 'cats', 'vercel-marketing'],
        }),
      ).toThrow(
        new Error(
          'The following apps passed via --local-apps are not in the microfrontends config: cats (microfrontends config contains: vercel-site, vercel-marketing, geist-docs, docs, nextjs-conf, other-app)',
        ),
      );
    });

    it('should throw on multipla bad app names', () => {
      expect(() =>
        LocalProxy.fromFile(join(fixtures, 'simple.jsonc'), {
          localApps: ['cats', 'docs', 'blue'],
        }),
      ).toThrow(
        new Error(
          'The following apps passed via --local-apps are not in the microfrontends config: cats, blue (microfrontends config contains: vercel-site, vercel-marketing, geist-docs, docs, nextjs-conf, other-app)',
        ),
      );
    });

    it('should suceed on correct app names', () => {
      expect(() =>
        LocalProxy.fromFile(join(fixtures, 'simple.jsonc'), {
          localApps: ['vercel-site', 'docs'],
        }),
      ).not.toThrow();
    });
  });
});
