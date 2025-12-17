import type { Rewrite } from 'next/dist/lib/load-custom-routes';
import { logger } from '../../../bin/logger';
import type { TransformConfigInput, TransformConfigResponse } from './types';

function debugRewrites(rewrites: Rewrite[]): void {
  const indent = ' '.repeat(4);
  const header = 'rewrites (source → destination)';
  const separator = '⎯'.repeat(header.length);
  const maxSourceLength = Math.max(...rewrites.map((key) => key.source.length));
  const table = rewrites
    .map((route, idx) => {
      const paddedSource = route.source.padEnd(maxSourceLength);
      return `${indent} ${idx + 1}. ${paddedSource} →  ${route.destination}`;
    })
    .join('\n');

  logger.debug(`${indent}${header}\n${indent}${separator}\n${table}\n`);
}

interface DestinationConfig {
  pathname: string;
  domain?: string;
}

interface RewriteConfig {
  destination: DestinationConfig;
}

function rewritesMapToArr(rewrites: Map<string, RewriteConfig>): Rewrite[] {
  return Array.from(rewrites.entries()).flatMap(([source, rewrite]) => {
    const destination = `${rewrite.destination.domain || ''}${rewrite.destination.pathname}`;
    if (source === destination) return [];
    return [
      {
        source,
        destination,
      },
    ];
  });
}

export function transform(args: TransformConfigInput): TransformConfigResponse {
  const { app, next } = args;

  const buildBeforeFiles = (): Rewrite[] => {
    const rewrites = new Map<string, RewriteConfig>();

    if (!app.isDefault()) {
      // setup _next rewrite for child app assets for Next.js < v15
      rewrites.set(`/${app.getAssetPrefix()}/_next/:path+`, {
        destination: {
          pathname: '/_next/:path+',
        },
      });

      // These rewrites are used in development, as a fallback for when the
      // microfrontends development proxy is not running, and when the deployed
      // child application is hit directly, not as part of the microfrontend url.

      // This is used by the Vercel Toolbar to automatically fetch the flags
      // from both the child and parent microfrontends.
      rewrites.set(`/${app.getAssetPrefix()}/.well-known/vercel/flags`, {
        destination: {
          pathname: '/.well-known/vercel/flags',
        },
      });
      // This is used by the @vercel/firewall package to query a rate limit set
      // in the Vercel Firewall.
      rewrites.set(
        `/${app.getAssetPrefix()}/.well-known/vercel/rate-limit-api/:path*`,
        {
          destination: {
            pathname: '/.well-known/vercel/rate-limit-api/:path*',
          },
        },
      );
      // This is used by the Vercel Toolbar to automatically fetch the flags
      // from both the child and parent microfrontends.
      rewrites.set(`/${app.getAssetPrefix()}/_vercel/:path*`, {
        destination: {
          pathname: '/_vercel/:path*',
        },
      });
    }

    return rewritesMapToArr(rewrites);
  };

  const newBeforeFiles = buildBeforeFiles();
  if (next.rewrites && typeof next.rewrites === 'function') {
    // we already have rewrites, we have to merge them
    const originalRewritesFn = next.rewrites;
    next.rewrites = async () => {
      const originalRewrites = await originalRewritesFn();
      if (
        typeof originalRewrites === 'object' &&
        !Array.isArray(originalRewrites)
      ) {
        const { beforeFiles = [] } = originalRewrites;
        return {
          beforeFiles: [...newBeforeFiles, ...beforeFiles],
          afterFiles: originalRewrites.afterFiles,
          fallback: originalRewrites.fallback,
        };
      }
      return {
        beforeFiles: newBeforeFiles,
        afterFiles: originalRewrites,
        fallback: [],
      };
    };
  } else {
    // rewrites aren't defined, we can write our own
    next.rewrites = async () => ({
      beforeFiles: newBeforeFiles,
      afterFiles: [],
      fallback: [],
    });
  }

  debugRewrites(newBeforeFiles);

  return {
    next,
  };
}
