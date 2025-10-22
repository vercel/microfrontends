import { parse } from 'jsonc-parser';
import { getConfigStringFromEnv } from '../utils/get-config-from-env';
import { isDefaultApp } from '../../schema/utils/is-default-app';
import type { Config } from '../../schema/types';
import { MicrofrontendError } from '../../errors';
import { type OverridesConfig, parseOverrides } from '../../overrides';
import type { ClientConfig } from '../client/types';
import { MicrofrontendConfigClient } from '../client';
import { DefaultApplication, ChildApplication } from './application';
import { DEFAULT_LOCAL_PROXY_PORT } from './constants';
import {
  validateConfigDefaultApplication,
  validateConfigPaths,
} from './validation';
import { hashApplicationName } from './utils/hash-application-name';

/**
 * A class to manage the microfrontends configuration.
 */
export class MicrofrontendConfigIsomorphic {
  config: Config;
  defaultApplication: DefaultApplication;
  childApplications: Record<string, ChildApplication> = {};
  overrides?: OverridesConfig;
  options?: Config['options'];

  private readonly serialized: {
    config: Config;
    overrides?: OverridesConfig;
  };

  constructor({
    config,
    overrides,
  }: {
    config: Config;
    overrides?: OverridesConfig;
  }) {
    // run validation on init
    MicrofrontendConfigIsomorphic.validate(config);

    const disableOverrides = config.options?.disableOverrides ?? false;
    this.overrides = overrides && !disableOverrides ? overrides : undefined;

    let defaultApplication: DefaultApplication | undefined;
    // create applications
    for (const [appId, appConfig] of Object.entries(config.applications)) {
      const appOverrides = !disableOverrides
        ? this.overrides?.applications[appId]
        : undefined;

      if (isDefaultApp(appConfig)) {
        defaultApplication = new DefaultApplication(appId, {
          app: appConfig,
          overrides: appOverrides,
        });
      } else {
        this.childApplications[appId] = new ChildApplication(appId, {
          app: appConfig,
          overrides: appOverrides,
        });
      }
    }

    // validate that this.defaultApplication is defined
    if (!defaultApplication) {
      throw new MicrofrontendError(
        'Could not find default application in microfrontends configuration',
        {
          type: 'application',
          subtype: 'not_found',
        },
      );
    }
    this.defaultApplication = defaultApplication;

    this.config = config;
    this.options = config.options;
    this.serialized = {
      config,
      overrides,
    };
  }

  static validate(config: string | Config): Config {
    // let this throw if it's not valid JSON
    const c = typeof config === 'string' ? (parse(config) as Config) : config;

    validateConfigPaths(c.applications);
    validateConfigDefaultApplication(c.applications);

    return c;
  }

  static fromEnv({
    cookies,
  }: {
    cookies?: { name: string; value: string }[];
  }): MicrofrontendConfigIsomorphic {
    return new MicrofrontendConfigIsomorphic({
      config: parse(getConfigStringFromEnv()) as Config,
      overrides: parseOverrides(cookies ?? []),
    });
  }

  isOverridesDisabled(): boolean {
    return this.options?.disableOverrides ?? false;
  }

  getConfig(): Config {
    return this.config;
  }

  getApplicationsByType(): {
    defaultApplication?: DefaultApplication;
    applications: ChildApplication[];
  } {
    return {
      defaultApplication: this.defaultApplication,
      applications: Object.values(this.childApplications),
    };
  }

  getChildApplications(): ChildApplication[] {
    return Object.values(this.childApplications);
  }

  getAllApplications(): (DefaultApplication | ChildApplication)[] {
    return [
      this.defaultApplication,
      ...Object.values(this.childApplications),
    ].filter(Boolean);
  }

  getApplication(name: string): DefaultApplication | ChildApplication {
    // check the default
    if (
      this.defaultApplication.name === name ||
      this.defaultApplication.packageName === name
    ) {
      return this.defaultApplication;
    }
    const app =
      this.childApplications[name] ||
      Object.values(this.childApplications).find(
        (child) => child.packageName === name,
      );
    if (!app) {
      throw new MicrofrontendError(
        `Could not find microfrontends configuration for application "${name}". If the name in package.json differs from your Vercel Project name, set the \`packageName\` field for the application in \`microfrontends.json\` to ensure that the configuration can be found locally.`,
        {
          type: 'application',
          subtype: 'not_found',
        },
      );
    }

    return app;
  }

  hasApplication(name: string): boolean {
    try {
      this.getApplication(name);
      return true;
    } catch {
      return false;
    }
  }

  getApplicationByProjectName(
    projectName: string,
  ): DefaultApplication | ChildApplication | undefined {
    // check the default
    if (this.defaultApplication.name === projectName) {
      return this.defaultApplication;
    }

    return Object.values(this.childApplications).find(
      (app) => app.name === projectName,
    );
  }

  /**
   * Returns the default application.
   */
  getDefaultApplication(): DefaultApplication {
    return this.defaultApplication;
  }

  /**
   * Returns the configured port for the local proxy
   */
  getLocalProxyPort(): number {
    return this.config.options?.localProxyPort ?? DEFAULT_LOCAL_PROXY_PORT;
  }

  toClientConfig(options?: {
    removeFlaggedPaths?: boolean;
  }): MicrofrontendConfigClient {
    const applications: ClientConfig['applications'] = Object.fromEntries(
      Object.entries(this.childApplications).map(([name, application]) => [
        hashApplicationName(name),
        {
          default: false,
          routing: application.routing,
        },
      ]),
    );

    applications[hashApplicationName(this.defaultApplication.name)] = {
      default: true,
    };

    return new MicrofrontendConfigClient(
      {
        applications,
      },
      {
        removeFlaggedPaths: options?.removeFlaggedPaths,
      },
    );
  }

  /**
   * Serializes the class back to the Schema type.
   *
   * NOTE: This is used when writing the config to disk and must always match the input Schema
   */
  toSchemaJson(): Config {
    return this.serialized.config;
  }

  serialize(): {
    config: Config;
    overrides?: OverridesConfig;
  } {
    return this.serialized;
  }
}
