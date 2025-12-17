import type { ApplicationOverrideConfig } from '../../overrides';
import type {
  Application as ApplicationConfig,
  ChildApplication as ChildApplicationConfig,
  DefaultApplication as DefaultApplicationConfig,
  PathGroup,
} from '../../schema/types';
import { Host, LocalHost } from './host';
import { generateAssetPrefixFromName } from './utils/generate-asset-prefix';
import { generateAutomationBypassEnvVarName } from './utils/generate-automation-bypass-env-var-name';
import { validateAppPaths } from './validation';

export class Application {
  readonly default: boolean;
  name: string;
  development: {
    local: LocalHost;
    fallback?: Host;
  };
  fallback?: Host;
  packageName?: string;
  overrides?: {
    environment?: Host;
  };
  readonly serialized: ApplicationConfig;

  constructor(
    name: string,
    {
      app,
      overrides,
      isDefault,
    }: {
      app: ApplicationConfig;
      overrides?: ApplicationOverrideConfig;
      isDefault?: boolean;
    },
  ) {
    this.name = name;
    this.development = {
      local: new LocalHost({
        appName: name,
        local: app.development?.local,
      }),
      fallback: app.development?.fallback
        ? new Host(app.development.fallback)
        : undefined,
    };
    if (app.development?.fallback) {
      this.fallback = new Host(app.development.fallback);
    }
    this.packageName = app.packageName;
    this.overrides = overrides?.environment
      ? {
          environment: new Host(overrides.environment),
        }
      : undefined;
    this.default = isDefault ?? false;
    this.serialized = app;
  }

  isDefault(): boolean {
    return this.default;
  }

  getAssetPrefix(): string {
    const generatedAssetPrefix = generateAssetPrefixFromName({
      name: this.name,
    });
    if ('assetPrefix' in this.serialized) {
      return this.serialized.assetPrefix ?? generatedAssetPrefix;
    }
    return generatedAssetPrefix;
  }

  getAutomationBypassEnvVarName(): string {
    return generateAutomationBypassEnvVarName({ name: this.name });
  }

  serialize(): ApplicationConfig {
    return this.serialized;
  }
}

export class DefaultApplication extends Application {
  readonly default = true;
  fallback: Host;

  constructor(
    name: string,
    {
      app,
      overrides,
    }: {
      app: DefaultApplicationConfig;
      overrides?: ApplicationOverrideConfig;
    },
  ) {
    super(name, {
      app,
      overrides,
      isDefault: true,
    });

    this.fallback = new Host(app.development.fallback);
  }

  getAssetPrefix(): string {
    return '';
  }
}

export class ChildApplication extends Application {
  readonly default = false;
  routing: PathGroup[];

  constructor(
    name: string,
    {
      app,
      overrides,
    }: {
      app: ChildApplicationConfig;
      overrides?: ApplicationOverrideConfig;
    },
  ) {
    // validate
    ChildApplication.validate(name, app);

    super(name, {
      app,
      overrides,
      isDefault: false,
    });

    this.routing = app.routing;
  }

  static validate(name: string, app: ChildApplicationConfig): void {
    // validate routes
    validateAppPaths(name, app);
  }
}
