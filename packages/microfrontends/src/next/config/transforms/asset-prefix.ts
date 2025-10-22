import type { TransformConfigInput, TransformConfigResponse } from './types';

export function transform(args: TransformConfigInput): TransformConfigResponse {
  const { next, app } = args;

  if (app.isDefault()) {
    return {
      next,
    };
  }

  const assetPrefix = `/${app.getAssetPrefix()}`;

  if (next.assetPrefix !== undefined && next.assetPrefix !== assetPrefix) {
    // The assetPrefix is a computable value from the app name as it is used for routing once deployed on Vercel
    throw new Error(
      `"assetPrefix" already set and does not equal "${assetPrefix}". Either omit the assetPrefix in your next config, or set it to "${assetPrefix}".`,
    );
  }

  next.assetPrefix = assetPrefix;
  next.images = {
    ...next.images,
    path: `${assetPrefix}/_next/image`,
  };

  return {
    next,
  };
}
