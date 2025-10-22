import type { OverridesConfig } from './types';
import { getOverrideFromCookie } from './get-override-from-cookie';

export function parseOverrides(
  cookies: { name: string; value?: string | null }[],
): OverridesConfig {
  const overridesConfig: OverridesConfig = { applications: {} };

  cookies.forEach((cookie) => {
    const override = getOverrideFromCookie(cookie);
    if (!override) return;
    overridesConfig.applications[override.application] = {
      environment: { host: override.host },
    };
  });

  return overridesConfig;
}
