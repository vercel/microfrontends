// cookie name needs to match proxy
// https://github.com/vercel/proxy/blob/fb00d723136ad539a194e4a851dd272010527c35/lib/routing/micro_frontends_overrides.lua#L7
export const OVERRIDES_COOKIE_PREFIX = 'vercel-micro-frontends-override';
export const OVERRIDES_ENV_COOKIE_PREFIX = `${OVERRIDES_COOKIE_PREFIX}:env:`;
