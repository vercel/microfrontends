import type { HostConfig } from '../../bin/types';
import type { ApplicationId } from '../schema/types';

export interface ApplicationOverrideConfig {
  environment?: HostConfig;
}

/**
 * Used to override the configuration for the application zone at runtime.
 * The configuration is used by the `vercel-micro-frontends-overrides` cookie set by the Vercel Toolbar.
 * The overrides config has the same shape as the `Config` type.
 */
export interface OverridesConfig {
  applications: Record<ApplicationId, ApplicationOverrideConfig>;
}
