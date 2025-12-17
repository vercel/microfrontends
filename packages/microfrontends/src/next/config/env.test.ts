import { join } from 'node:path';
import { MicrofrontendsServer } from '../../config/microfrontends/server';
import { fileURLToPath } from '../../test-utils/file-url-to-path';
import { setEnvironment } from './env';

const fixtures = fileURLToPath(
  new URL('../../config/__fixtures__', import.meta.url),
);

const OLD_ENV = process.env;

describe('withMicrofrontends: setEnvironment', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('sets all server env vars', () => {
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });

    const serverConfig = JSON.stringify(microfrontends.config.getConfig());
    const currentApp = microfrontends.config.getApplication('docs');
    setEnvironment({
      app: currentApp,
      microfrontends,
    });

    // validate server env
    expect(process.env.MFE_CURRENT_APPLICATION).toEqual(currentApp.name);
    expect(process.env.MFE_CONFIG).toEqual(serverConfig);
  });

  it('sets preview domains env var if VERCEL_ENV === preview', () => {
    process.env.VERCEL_ENV = 'preview';
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });

    const serverConfig = JSON.stringify(microfrontends.config.getConfig());
    const currentApp = microfrontends.config.getApplication('docs');

    setEnvironment({
      app: currentApp,
      microfrontends,
    });

    // validate server env
    expect(process.env.MFE_CURRENT_APPLICATION).toEqual(currentApp.name);
    expect(process.env.MFE_CONFIG).toEqual(serverConfig);
  });

  it('sets all client env vars', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.ROUTE_OBSERVABILITY_TO_THIS_PROJECT = '1';
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });
    const clientConfig = JSON.stringify(
      microfrontends.config
        .toClientConfig({
          removeFlaggedPaths: true,
        })
        .serialize(),
    );
    const currentApp = microfrontends.config.getApplication('docs');

    setEnvironment({
      app: currentApp,
      microfrontends,
    });

    // validate client env
    expect(process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION).toEqual(
      currentApp.name,
    );
    expect(process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH).toEqual(
      'e3e2a9',
    );
    expect(process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG).toEqual(clientConfig);
    expect(process.env.NEXT_PUBLIC_VERCEL_FIREWALL_PATH_PREFIX).toEqual(
      '/vc-ap-e3e2a9',
    );
    expect(process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH).toEqual(
      '/vc-ap-e3e2a9/_vercel',
    );
  });

  it("doesn't set observability prefix with no asset prefix", () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.ROUTE_OBSERVABILITY_TO_THIS_PROJECT = '1';
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });

    const currentApp = microfrontends.config.getApplication('vercel-site');

    setEnvironment({
      app: currentApp,
      microfrontends,
    });

    expect(
      process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH,
    ).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_VERCEL_FIREWALL_PATH_PREFIX).toBeUndefined();
  });

  it("doesn't set observability prefix without ROUTE_OBSERVABILITY_TO_THIS_PROJECT", () => {
    process.env.VERCEL_ENV = 'preview';
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });

    const currentApp = microfrontends.config.getApplication('vercel-marketing');

    setEnvironment({
      app: currentApp,
      microfrontends,
    });

    expect(
      process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH,
    ).toBeUndefined();
  });
});
