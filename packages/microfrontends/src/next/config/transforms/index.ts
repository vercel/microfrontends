import type { TransformConfigInput, TransformConfigResponse } from './types';
import { transform as assetPrefixTransform } from './asset-prefix';
import { transform as buildIdTransform } from './build-id';
import { transform as draftModeTransform } from './draft-mode';
import { transform as redirectsTransform } from './redirects';
import { transform as transpilePackagesTransform } from './transpile-packages';
import { transform as rewritesTransform } from './rewrites';
import { transform as webpackTransform } from './webpack';

export type TransformKeys =
  | 'assetPrefix'
  | 'buildId'
  | 'draftMode'
  | 'redirects'
  | 'rewrites'
  | 'transpilePackages'
  | 'webpack';

export const transforms: Record<
  TransformKeys,
  (args: TransformConfigInput) => TransformConfigResponse
> = {
  assetPrefix: assetPrefixTransform,
  buildId: buildIdTransform,
  draftMode: draftModeTransform,
  redirects: redirectsTransform,
  rewrites: rewritesTransform,
  transpilePackages: transpilePackagesTransform,
  webpack: webpackTransform,
} as const;
