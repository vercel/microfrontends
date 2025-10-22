import { MicrofrontendError } from '../../errors';

/**
 * Utility to fetch the microfrontend configuration string from the environment.
 */
export function getConfigStringFromEnv(): string {
  const config = process.env.MFE_CONFIG;
  if (!config) {
    throw new MicrofrontendError(`Missing "MFE_CONFIG" in environment.`, {
      type: 'config',
      subtype: 'not_found_in_env',
    });
  }
  return config;
}
