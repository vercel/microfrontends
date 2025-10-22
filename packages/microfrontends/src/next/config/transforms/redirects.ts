import { routeToLocalProxy } from '../../utils/route-to-local-proxy';
import type { TransformConfigInput, TransformConfigResponse } from './types';

export function transform(args: TransformConfigInput): TransformConfigResponse {
  const { next, microfrontend, opts } = args;
  const isProduction = opts?.isProduction ?? false;

  const requireLocalProxyHeader =
    routeToLocalProxy() &&
    !isProduction &&
    !process.env.MFE_DISABLE_LOCAL_PROXY_REWRITE;

  if (requireLocalProxyHeader) {
    // If local proxy is running, redirect all requests without the header set by the local proxy to the local proxy.
    const proxyRedirects = [
      {
        source: '/:path*',
        destination: `http://localhost:${microfrontend.getLocalProxyPort()}/:path*`,
        permanent: false,
        missing: [{ type: 'header', key: 'x-vercel-mfe-local-proxy-origin' }],
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
    if (process.env.MFE_DEBUG) {
      const indent = ' '.repeat(4);
      const header = 'redirects';
      const separator = '⎯'.repeat(header.length);

      // eslint-disable-next-line no-console
      console.log(
        `${indent}${header}\n${indent}${separator}\n${indent} - Automatically redirecting all requests to local microfrontends proxy\n`,
      );
    }
  }

  return { next };
}
