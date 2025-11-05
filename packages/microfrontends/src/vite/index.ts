import type { Plugin, UserConfig } from 'vite';
import { MicrofrontendsServer } from '../config/microfrontends/server';
import { getApplicationContext } from '../config/microfrontends/utils/get-application-context';
import { logger } from '../bin/logger';
import { detectFramework } from './detect-framework';

interface MicrofrontendsViteOptions {
  /**
   * An optional base path to use instead of an asset prefix. This will prefix
   * _all_ paths in an application with the provided string. This can be used
   * when it is okay if every path has a common path prefix. If an application
   * has URLs that don't share a common path prefix, omit this option.
   *
   * See https://vite.dev/guide/build#public-base-path for more information.
   */
  basePath?: string;
}

/**
 * Set up Vite with necessary configuration for microfrontends. This should be
 * used with any framework that uses Vite as the bundler.
 *
 * See the [Getting Started](https://vercel.com/docs/microfrontends/quickstart) guide for more information.
 *
 * @example Setting up Vite with microfrontends
 * ```ts filename="vite.config.ts"
 * import { microfrontends } from '@vercel/microfrontends/experimental/vite';
 * export default defineConfig({
 *   plugins: [microfrontends()],
 * });
 * ```
 */
export function microfrontends(opts?: MicrofrontendsViteOptions): Plugin {
  const { name: fromApp } = getApplicationContext();
  const microfrontendsObj = MicrofrontendsServer.infer();
  const app = microfrontendsObj.config.getApplication(fromApp);

  if (app.isDefault() && opts?.basePath) {
    throw new Error(
      '`basePath` can not be set for the default microfrontends application.',
    );
  }
  const framework = detectFramework();
  if (framework === 'sveltekit' && opts?.basePath) {
    throw new Error('`basePath` is not supported for SvelteKit applications.');
  }
  if (
    opts?.basePath &&
    (!opts.basePath.startsWith('/') || opts.basePath.endsWith('/'))
  ) {
    throw new Error('`basePath` must start with a `/` and not end with a `/`');
  }

  const additionalConfigOptions: UserConfig = {};

  if (!app.isDefault()) {
    if (opts?.basePath) {
      const basePath = opts.basePath;
      // The base path is not set for React Router on Vercel since it results
      // in a double prefixing of the base path.
      if (framework !== 'react-router' || !process.env.VERCEL_ENV) {
        additionalConfigOptions.base = basePath;
      }
      if (framework === 'react-router') {
        // React Router, used as a framework, overrides the Vite configuration when
        // base path is set and ignores the `outDir` option. However, this causes
        // assets to fail to load. Setting the `assetsDir` option to the base path
        // fixes this issue.
        additionalConfigOptions.build = {
          assetsDir: `./${basePath}`,
        };
      } else {
        // By setting `outDir`, we ensure that all output files are placed in
        // the correct directory for serving under the base path prefix.
        additionalConfigOptions.build = {
          outDir: `dist${opts.basePath}`,
        };
      }
    } else if (framework !== 'sveltekit') {
      // Asset prefixing is handled automatically by changing the assetsDir
      // to the correct path.
      // SvelteKit assets are already prefixed using svelte.config.js.
      additionalConfigOptions.build = {
        assetsDir: `./${app.getAssetPrefix()}`,
      };
    }
  }
  if (app.development.local.port) {
    additionalConfigOptions.server = {
      port: app.development.local.port,
    };
    additionalConfigOptions.preview = {
      port: app.development.local.port,
    };
  }
  logger.debug(
    '[@vercel/microfrontends] Updating Vite configuration with the following changes:',
    additionalConfigOptions,
  );
  return {
    name: 'vite-plugin-vercel-microfrontends',
    config: () => {
      return {
        ...additionalConfigOptions,
        define: {
          'import.meta.env.MFE_CURRENT_APPLICATION': JSON.stringify(app.name),
          'import.meta.env.MFE_CONFIG': JSON.stringify(
            microfrontendsObj.config.getConfig(),
          ),
        },
      };
    },
  };
}
