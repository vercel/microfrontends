import type { MicrofrontendsServer } from '../../config/microfrontends/server';
import type {
  ChildApplication,
  DefaultApplication,
} from '../../config/microfrontends-config/isomorphic/application';
import { hashApplicationName } from '../../config/microfrontends-config/isomorphic/utils/hash-application-name';

function debugEnv(env: Record<string, string>): void {
  if (process.env.MFE_DEBUG) {
    const indent = ' '.repeat(4);
    const header = 'env (key → val)';
    const separator = '⎯'.repeat(header.length);

    const maxKeyLength = Math.max(...Object.keys(env).map((key) => key.length));
    const table = Object.keys(env)
      .map((key, idx) => {
        const paddedKey = key.padEnd(maxKeyLength);
        return `${indent} ${idx + 1}. ${paddedKey} =   ${env[key]}`;
      })
      .join('\n');

    // eslint-disable-next-line no-console
    console.log(`${indent}${header}\n${indent}${separator}\n${table}\n`);
  }
} /**
 * Default application
 *  - MFE_CURRENT_APPLICATION
 *  - NEXT_PUBLIC_MFE_CURRENT_APPLICATION
 *  - NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH
 *  - NEXT_PUBLIC_MFE_CLIENT_CONFIG
 *  - MFE_CONFIG
 *
 * Child application(s):
 *  - MFE_CURRENT_APPLICATION
 *  - NEXT_PUBLIC_MFE_CURRENT_APPLICATION
 *  - NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH
 */
export function setEnvironment({
  app,
  microfrontends,
}: {
  app: ChildApplication | DefaultApplication;
  microfrontends: MicrofrontendsServer;
}): void {
  const clientEnvs = {
    NEXT_PUBLIC_MFE_CURRENT_APPLICATION: app.name,
    NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH: hashApplicationName(app.name),
    NEXT_PUBLIC_MFE_CLIENT_CONFIG: JSON.stringify(
      microfrontends.config
        .toClientConfig({
          removeFlaggedPaths: true,
        })
        .serialize(),
    ),
    ...(app.getAssetPrefix()
      ? {
          NEXT_PUBLIC_VERCEL_FIREWALL_PATH_PREFIX: `/${app.getAssetPrefix()}`,
        }
      : {}),
    ...(process.env.ROUTE_OBSERVABILITY_TO_THIS_PROJECT && app.getAssetPrefix()
      ? {
          NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH: `/${app.getAssetPrefix()}/_vercel`,
        }
      : {}),
  };

  const serverEnvs: Record<string, string> = {
    MFE_CURRENT_APPLICATION: app.name,
    MFE_CONFIG: JSON.stringify(microfrontends.config.getConfig()),
  };

  const allEnvs = { ...clientEnvs, ...serverEnvs };

  // set
  for (const [key, value] of Object.entries(allEnvs)) {
    process.env[key] = value;
  }

  // debug (optional)
  debugEnv(allEnvs);
}
