import type { NextConfig } from 'next';
import type { MicrofrontendsConfig } from '../../../config/microfrontends/types';
import type {
  ChildApplication,
  DefaultApplication,
} from '../../../config/microfrontends-config/isomorphic/application';

export interface TransformConfigOptions {
  isProduction: boolean;
  supportPagesRouter?: boolean;
  // Prefer the legacy behavior of using webpack.EnvironmentPlugin instead of
  // Next.js's `defineServer` option, even when Next.js is new enough to support it.
  preferWebpackEnvironmentPlugin?: boolean;
}

export interface TransformConfigInput {
  app: ChildApplication | DefaultApplication;
  next: NextConfig;
  microfrontend: MicrofrontendsConfig;
  opts?: TransformConfigOptions;
}

export interface TransformConfigResult {
  next: NextConfig;
}

export type TransformConfigResponse = TransformConfigResult;
