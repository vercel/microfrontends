import { isOverrideCookie } from './is-override-cookie';
import { OVERRIDES_ENV_COOKIE_PREFIX } from './constants';

export function getOverrideFromCookie(cookie: {
  name: string;
  value?: string | null;
}): { application: string; host: string } | undefined {
  if (!isOverrideCookie(cookie) || !cookie.value) return;
  return {
    application: cookie.name.replace(OVERRIDES_ENV_COOKIE_PREFIX, ''),
    host: cookie.value,
  };
}
