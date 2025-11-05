import type { NextConfig } from 'next';
import { displayLocalProxyInfo } from '../../bin/check-proxy';
import { MicrofrontendsServer } from '../../config/microfrontends/server';
import { getApplicationContext } from '../../config/microfrontends/utils/get-application-context';
import { logger } from '../../bin/logger';
import { transforms } from './transforms';
import { setEnvironment } from './env';
import type { WithMicrofrontendsOptions } from './types';

function typedEntries<T extends Record<string, unknown>>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Automatically configures your Next.js application to work with microfrontends.
 *
 * This function should wrap your Next.js config object before it is exported. It
 * will automatically set up the necessary fields and environment variables for
 * microfrontends to work.
 *
 * See the [Getting Started](https://vercel.com/docs/microfrontends/quickstart) guide for more information.
 *
 * @example Wrapping your Next.js config
 * ```js
 * import { withMicrofrontends } from '@vercel/microfrontends/next/config';
 *
 * const nextConfig = { ... };
 *
 * export default withMicrofrontends(nextConfig);
 * ```
 */
export function withMicrofrontends(
  nextConfig: NextConfig,
  opts?: WithMicrofrontendsOptions,
): NextConfig {
  if (opts?.debug) {
    process.env.MFE_DEBUG = 'true';
  }
  const { name: fromApp } = getApplicationContext(opts);
  const microfrontends = MicrofrontendsServer.infer({
    appName: fromApp,
    filePath: opts?.configPath,
  });

  // fetch the config for the current app
  const app = microfrontends.config.getApplication(fromApp);

  // configure the environment
  setEnvironment({ app, microfrontends });

  let next = { ...nextConfig };

  for (const [key, transform] of typedEntries(transforms)) {
    if (opts?.skipTransforms?.includes(key)) {
      logger.info(`Skipping ${key} transform`);
      continue;
    }

    try {
      const transformedConfig = transform({
        app,
        next,
        microfrontend: microfrontends.config,
        opts: {
          supportPagesRouter: opts?.supportPagesRouter,
        },
      });
      next = transformedConfig.next;
    } catch (e) {
      logger.error('Error transforming next config', e);
      // Fail the build
      throw e;
    }
  }

  const localProxyPort = microfrontends.config.getLocalProxyPort();
  if (typeof localProxyPort === 'number') {
    // save the local proxy port to an environment variable for easy access
    process.env.MFE_LOCAL_PROXY_PORT = localProxyPort.toString();
  }

  displayLocalProxyInfo(localProxyPort);
  return next;
}
