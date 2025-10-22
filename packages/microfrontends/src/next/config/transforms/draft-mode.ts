import type { TransformConfigInput, TransformConfigResponse } from './types';

/**
 * The `experimental.multiZoneDraftMode` field is used to prevent Next.js from
 * clearing the draft mode cookie that comes from a different zone.
 */
export function transform(args: TransformConfigInput): TransformConfigResponse {
  const { next } = args;

  if (next.experimental?.multiZoneDraftMode !== undefined) {
    return {
      next,
    };
  }

  next.experimental = next.experimental || {};
  next.experimental.multiZoneDraftMode = true;

  return {
    next,
  };
}
