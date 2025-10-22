import { nanoid } from 'nanoid';
import type { TransformConfigInput, TransformConfigResponse } from './types';

/**
 * Generates a unique build ID for each microfrontend that contains the
 * asset prefix. The build ID is used in Next.js as part of /_next/data
 * requests, allowing us to insert a unique prefix that we can use to route
 * /_next/data requests to the correct application.
 */
export function transform(args: TransformConfigInput): TransformConfigResponse {
  const { app, next, opts } = args;

  if (!opts?.supportPagesRouter) {
    return { next };
  }

  if (next.generateBuildId !== undefined) {
    throw new Error(
      '"generateBuildId" must not already be set in next.config.js when using microfrontends with "supportPagesRouter"',
    );
  }

  if (!app.isDefault()) {
    next.generateBuildId = () => {
      return `${app.getAssetPrefix()}-${nanoid()}`;
    };
  }

  return {
    next,
  };
}
