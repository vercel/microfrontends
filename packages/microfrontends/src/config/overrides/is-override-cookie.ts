import { OVERRIDES_COOKIE_PREFIX } from './constants';

export function isOverrideCookie(cookie: { name?: string }): boolean {
  return Boolean(cookie.name?.startsWith(OVERRIDES_COOKIE_PREFIX));
}
