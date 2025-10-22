import type { MicrofrontendConfigIsomorphic } from '../microfrontends-config/isomorphic';
import type { WellKnownClientData } from './types';

/**
 * @deprecated Add `/.well-known/vercel/microfrontends/client-config` to your middleware matcher instead.
 *
 * Returns data used by the client to ensure that navigations across
 * microfrontend boundaries are routed and prefetched correctly for flagged paths.
 * The client configuration is safe to expose to users.
 *
 * If there are no flagged paths, this endpoint is not used.
 *
 * This data should be exposed in a `.well-known/vercel/microfrontends/client-config` endpoint.
 */
export async function getWellKnownClientData(
  config: MicrofrontendConfigIsomorphic,
  flagValues: Record<string, () => Promise<boolean>> = {},
): Promise<WellKnownClientData> {
  const clientConfig = config.toClientConfig();
  for (const [applicationName, application] of Object.entries(
    clientConfig.applications,
  )) {
    if (!application.routing) {
      continue;
    }
    const allPaths: string[] = [];
    for (const pathGroup of application.routing) {
      if (pathGroup.flag) {
        const flagName = pathGroup.flag;
        const flagFn = flagValues[flagName];
        if (!flagFn) {
          throw new Error(
            `Flag "${flagName}" was specified to control routing for path group "${pathGroup.group}" in application ${applicationName} but not found in provided flag values.`,
          );
        }
        // eslint-disable-next-line no-await-in-loop
        const flagEnabled = await flagFn();
        if (flagEnabled) {
          allPaths.push(...pathGroup.paths);
        }
      } else {
        allPaths.push(...pathGroup.paths);
      }
    }
    // Condense all path groups into a single group without flag values
    application.routing = allPaths.length > 0 ? [{ paths: allPaths }] : [];
  }

  return {
    config: clientConfig.serialize(),
  };
}
