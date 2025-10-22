import { OVERRIDES_ENV_COOKIE_PREFIX } from './constants';

export function getAppEnvOverrideCookieName(application: string): string {
  return `${OVERRIDES_ENV_COOKIE_PREFIX}${application}`;
}
