import type { Config } from '@sveltejs/kit';
import { displayLocalProxyInfo } from '../../bin/check-proxy';
import { MicrofrontendsServer } from '../../config/microfrontends/server';
import { getApplicationContext } from '../../config/microfrontends/utils/get-application-context';

export interface WithMicrofrontendsOptions {
  /**
   * Explicitly set the name of the application instead of using the name from the package.json.
   */
  appName?: string;
  /**
   * @deprecated Use VC_MICROFRONTENDS_CONFIG_FILE_NAME instead. This option is
   * deprecated and will be removed in a future release. The env var enables the
   * vercel build to also read the custom config file / path.
   */
  configPath?: string;
}

export function withMicrofrontends(
  config: Config,
  opts?: WithMicrofrontendsOptions,
): Config {
  const { name: fromApp } = getApplicationContext(opts);
  const microfrontends = MicrofrontendsServer.infer({
    filePath: opts?.configPath,
  });

  // fetch the config for the current app
  const app = microfrontends.config.getApplication(fromApp);

  if (!app.isDefault()) {
    const assetPrefix = app.getAssetPrefix();
    if (config.kit?.appDir !== undefined && config.kit.appDir !== assetPrefix) {
      throw new Error(
        `"appDir" is already set and does not equal ${assetPrefix}. Either omit "appDir" in your Svelte config, or set it to "${assetPrefix}".`,
      );
    }
    if (!config.kit) {
      config.kit = {};
    }
    config.kit.appDir = assetPrefix;
  }

  displayLocalProxyInfo(microfrontends.config.getLocalProxyPort());

  return config;
}
