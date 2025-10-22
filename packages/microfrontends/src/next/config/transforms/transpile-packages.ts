import type { TransformConfigInput, TransformConfigResponse } from './types';

// Add @vercel/microfrontends to the transpilePackages list. Pages Router doesn't bundle packages by
// default, but this package has be bundled so that the config env vars are inlined at build time
// (e.g. `NEXT_PUBLIC_MFE_CLIENT_CONFIG` in src/next/client/prefetch/prefetch-cross-zone-links.tsx).
export function transform(args: TransformConfigInput): TransformConfigResponse {
  const { next } = args;

  if (
    next.transpilePackages === undefined ||
    !next.transpilePackages.includes('@vercel/microfrontends')
  ) {
    next.transpilePackages = [
      ...(next.transpilePackages || []),
      '@vercel/microfrontends',
    ];
  }

  return {
    next,
  };
}
