import fs from 'node:fs';
import { createRequire } from 'node:module';
import type { NextConfig } from 'next';
import * as semver from 'semver';
import type webpack from 'webpack';
import type { WebpackOptionsNormalized } from 'webpack';
import { SortChunksPlugin } from '../plugins/sort-chunks';
import type { TransformConfigInput, TransformConfigResponse } from './types';

const nextVersion = getNextJsVersion();

export function transform(args: TransformConfigInput): TransformConfigResponse {
  const useDefineServer = args.opts?.preferWebpackEnvironmentPlugin
    ? false
    : semver.gte(nextVersion, '15.4.0-canary.41');

  const { next, microfrontend, opts } = args;

  const isNext16OrHigher = semver.gte(nextVersion, '16.0.0');
  const hasTurbopackConfig = Boolean(next.turbopack);
  const turbopackConfig =
    isNext16OrHigher && !hasTurbopackConfig ? { turbopack: {} } : {};

  const configWithWebpack: NextConfig = {
    ...next,
    ...turbopackConfig,
    ...(useDefineServer
      ? {
          compiler: {
            ...next.compiler,
            defineServer: {
              ...next.compiler?.defineServer,
              'process.env.MFE_CONFIG': JSON.stringify(
                microfrontend.serialize().config,
              ),
            },
          },
        }
      : {}),
    webpack(cfg, context): unknown {
      // execute the client config first, otherwise their config may accidentally
      // overwrite our required config - leading to unexpected errors.
      const config = (
        typeof next.webpack === 'function' ? next.webpack(cfg, context) : cfg
      ) as WebpackOptionsNormalized;

      const { isServer, nextRuntime, webpack: wpFromNext } = context;
      if (!useDefineServer && (isServer || nextRuntime === 'edge')) {
        config.plugins.push(
          new (wpFromNext as typeof webpack).EnvironmentPlugin({
            MFE_CONFIG: JSON.stringify(microfrontend.serialize().config),
          }),
        );
      }

      config.plugins.push(
        // Remove node: from import specifiers, because Next.js does not yet support node: scheme
        // https://github.com/vercel/next.js/issues/28774
        new (wpFromNext as typeof webpack).NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            resource.request = resource.request.replace(/^node:/, '');
          },
        ),
      );

      // Webpack 5 no longer polyfills Node.js core modules automatically which means
      // if you use them in your code running in browsers or alike, you will have to
      // install compatible modules from npm and include them yourself.
      // https://webpack.js.org/configuration/resolve/#resolvefallback
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          path: false,
          crypto: false,
          ...config.resolve.fallback,
        };
      }

      if (opts?.supportPagesRouter) {
        // Ensure deterministic module and chunk ids. See
        // https://github.com/vercel/next.js/issues/52827 for more information.
        config.optimization.moduleIds = 'deterministic';
        config.optimization.chunkIds = 'deterministic';

        // Add a custom plugin to sort chunks
        config.plugins.push(new SortChunksPlugin());
      }

      return config;
    },
  };

  return {
    next: configWithWebpack,
  };
}

function getNextJsVersion(): string {
  const cjsRequire =
    // This is used so we can use `require.resolve` to find the Next.js package:
    // - `import.meta.resolve` is not available in CJS or early Node.js versions.
    // - tsup/esbuild don't generate import meta urls for CJS modules, so use this as
    // a test to see if we're running in ESM. Referencing `import.meta.url` is
    // still grammatically valid in CJS because esbuild transforms it.
    typeof import.meta.url === 'string'
      ? createRequire(import.meta.url)
      : require;

  const parsedNextPackageJson: unknown = JSON.parse(
    fs.readFileSync(cjsRequire.resolve('next/package.json'), 'utf8'),
  );

  if (
    typeof parsedNextPackageJson !== 'object' ||
    parsedNextPackageJson === null
  ) {
    throw new Error("Could not read 'next/package.json'.");
  }

  const parsedNextVersion: unknown =
    'version' in parsedNextPackageJson && parsedNextPackageJson.version;

  if (typeof parsedNextVersion !== 'string') {
    throw new Error("Could not read version from 'next/package.json'.");
  }

  return parsedNextVersion;
}
