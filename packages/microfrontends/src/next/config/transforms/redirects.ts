import { localProxyIsRunning } from '../../../bin/local-proxy-is-running';
import { logger } from '../../../bin/logger';
import type { TransformConfigInput, TransformConfigResponse } from './types';

export function transform(args: TransformConfigInput): TransformConfigResponse {
  const { next, microfrontend } = args;

  const requireLocalProxyHeader =
    localProxyIsRunning() && !process.env.MFE_DISABLE_LOCAL_PROXY_REWRITE;

  if (requireLocalProxyHeader) {
    // If local proxy is running, redirect all requests without the header set by the local proxy to the local proxy.
    const proxyRedirects = [
      {
        source: `/:path*`,
        destination: `http://localhost:${microfrontend.getLocalProxyPort()}/:path*`,
        permanent: false,
        missing: [
          { type: 'header', key: 'x-vercel-mfe-local-proxy-origin' } as const,
        ],
        // this fixes relative path Next.js images locally. A security fix removed the headers from the image request,
        // https://github.com/vercel/next.js/pull/82114, and locally the image fetch does not follow redirects. This
        // means the header x-vercel-mfe-local-proxy-origin is stripped, and the redirect to then add the header back
        // in is not followed. As all headers are stripped, there is also no host header, so this check will ensure
        // relative path Next.js images are not redirected to the local proxy.
        has: [{ type: 'header', key: 'host' } as const],
      },
    ];
    if (next.redirects && typeof next.redirects === 'function') {
      // we already have rewrites, we have to merge them
      const originalRedirectsFn = next.redirects;
      next.redirects = async () => {
        const originalRedirects = await originalRedirectsFn();
        return [...proxyRedirects, ...originalRedirects];
      };
    } else {
      // rewrites aren't defined, we can write our own
      // eslint-disable-next-line @typescript-eslint/require-await
      next.redirects = async () => proxyRedirects;
    }
    const indent = ' '.repeat(4);
    const header = 'redirects';
    const separator = '⎯'.repeat(header.length);

    logger.debug(
      `${indent}${header}\n${indent}${separator}\n${indent} - Automatically redirecting all requests to local microfrontends proxy\n`,
    );
  }

  return { next };
}
