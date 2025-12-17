import { join } from 'node:path';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';
import type { NextConfig } from 'next';
import webpack, { type EnvironmentPlugin } from 'webpack';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { transform } from './webpack';

const OLD_ENV = process.env;

const fixtures = fileURLToPath(
  new URL('../../../config/__fixtures__', import.meta.url),
);

const mockWebpackSideEffect = jest.fn();

interface MockWebpackConfig {
  plugins: unknown[];
  resolve: {
    fallback: unknown;
  };
  target?: string;
}

describe('transform function', () => {
  const baseNextConfig: NextConfig = {
    webpack: (config: MockWebpackConfig): MockWebpackConfig => {
      mockWebpackSideEffect();
      return {
        ...config,
        target: 'serverless',
        resolve: {
          fallback: {
            foo: true,
          },
        },
        plugins: [{ resourceRegExp: 'foo' }],
      };
    },
  };

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    jest.resetAllMocks();
  });

  describe.each([
    { preferWebpackEnvironmentPlugin: false },
    { preferWebpackEnvironmentPlugin: true },
  ])('when using legacy EnvironmentPlugin: $preferWebpackEnvironmentPlugin', ({
    preferWebpackEnvironmentPlugin,
  }) => {
    it('sets MFE_CONFIG environment variable on the server', () => {
      const microfrontends = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      });

      const currentApplication = microfrontends.config.getDefaultApplication();
      const { next: newConfig } = transform({
        next: baseNextConfig,
        app: currentApplication,
        microfrontend: microfrontends.config,
        opts: {
          preferWebpackEnvironmentPlugin,
        },
      });

      const args = {
        isServer: true,
        nextRuntime: undefined,
        webpack,
      } as WebpackConfigContext;

      const currentConfig = { plugins: [] };
      const webpackConfig = newConfig.webpack?.(
        currentConfig,
        args,
      ) as MockWebpackConfig;
      expect(mockWebpackSideEffect).toHaveBeenCalled();
      expect(webpackConfig.target).toEqual('serverless');
      expectMfeConfigEnv({
        nextConfig: newConfig,
        webpackConfig,
        microfrontends,
        preferWebpackEnvironmentPlugin,
      });
    });

    it('does not set MFE_CONFIG environment variable on the client', () => {
      const microfrontends = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      });

      const currentApplication = microfrontends.config.getDefaultApplication();
      const { next: newConfig } = transform({
        next: baseNextConfig,
        app: currentApplication,
        microfrontend: microfrontends.config,
        opts: {
          preferWebpackEnvironmentPlugin,
        },
      });

      const args = {
        isServer: false,
        nextRuntime: undefined,
        webpack,
      } as WebpackConfigContext;

      const currentConfig = { plugins: [] };
      const webpackConfig = newConfig.webpack?.(
        currentConfig,
        args,
      ) as MockWebpackConfig;
      expect(mockWebpackSideEffect).toHaveBeenCalled();
      // Ensure the env var is set as expected
      expect(webpackConfig.plugins).toEqual([
        { resourceRegExp: 'foo' },
        { newResource: expect.anything(), resourceRegExp: /^node:/ },
      ]);
      expect(webpackConfig.resolve.fallback).toEqual({
        crypto: false,
        fs: false,
        path: false,
        foo: true,
      });
    });

    it('sets MFE_CONFIG environment variable in edge runtime', () => {
      const microfrontends = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      });

      const currentApplication = microfrontends.config.getDefaultApplication();
      const { next: newConfig } = transform({
        next: baseNextConfig,
        app: currentApplication,
        microfrontend: microfrontends.config,
        opts: {
          preferWebpackEnvironmentPlugin,
        },
      });

      // NOTE: I don't think this is a valid combo here, but we force it to isolate the logic for nextRuntime
      const args = {
        isServer: false,
        nextRuntime: 'edge',
        webpack,
      } as WebpackConfigContext;

      const currentConfig = { plugins: [], resolve: { fallback: undefined } };
      const webpackConfig = newConfig.webpack?.(
        currentConfig,
        args,
      ) as MockWebpackConfig;
      expect(mockWebpackSideEffect).toHaveBeenCalled();
      expect(webpackConfig.target).toEqual('serverless');
      expectMfeConfigEnv({
        nextConfig: newConfig,
        webpackConfig,
        microfrontends,
        preferWebpackEnvironmentPlugin,
      });
    });
  });
});

function expectMfeConfigEnv({
  nextConfig,
  webpackConfig,
  microfrontends,
  preferWebpackEnvironmentPlugin,
}: {
  nextConfig: NextConfig;
  webpackConfig: MockWebpackConfig;
  microfrontends: MicrofrontendsServer;
  preferWebpackEnvironmentPlugin: boolean;
}) {
  // Ensure the env var is set as expected
  if (preferWebpackEnvironmentPlugin) {
    expect(webpackConfig.plugins).toHaveLength(3);
    const envPlugin = webpackConfig.plugins[1] as EnvironmentPlugin;
    expect(envPlugin.keys).toEqual(['MFE_CONFIG']);
    expect(envPlugin.defaultValues.MFE_CONFIG).toEqual(
      JSON.stringify(microfrontends.config.config),
    );
  } else {
    expect(nextConfig.compiler?.defineServer).toEqual({
      'process.env.MFE_CONFIG': JSON.stringify(microfrontends.config.config),
    });
  }
}
