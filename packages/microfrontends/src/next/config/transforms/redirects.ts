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
    const proxyRedirects = [
      {
        source: `/:path*`,
        destination: `http://localhost:${microfrontend.getLocalProxyPort()}/:path*`,
        permanent: false,
        missing: [
          { type: 'header', key: 'x-vercel-mfe-local-proxy-origin' } as const,
        ],
        // this fixes relative path Next.js images locally. A security fix removed the headers from the image request,
        // https://github.com/vercel/next.js/pull/82114., and locally the image fetch does not follow redirects. This
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
