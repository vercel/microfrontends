import fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Config } from '../../schema/types';
import { parseOverrides } from '../../overrides';
import type { OverridesConfig } from '../../overrides';
import { getConfigStringFromEnv } from '../../microfrontends-config/utils/get-config-from-env';
import { MicrofrontendError } from '../../errors';
import { isDefaultApp } from '../../schema/utils/is-default-app';
import { findRepositoryRoot } from '../utils/find-repository-root';
import { inferMicrofrontendsLocation } from '../utils/infer-microfrontends-location';
import { isMonorepo as isRepositoryMonorepo } from '../utils/is-monorepo';
import { findPackageRoot } from '../utils/find-package-root';
import { findConfig } from '../utils/find-config';
import { MicrofrontendConfigIsomorphic } from '../../microfrontends-config/isomorphic';
import { getApplicationContext } from '../utils/get-application-context';
import { getOutputFilePath } from './utils/get-output-file-path';
import { validateSchema } from './validation';

class MicrofrontendsServer {
  config: MicrofrontendConfigIsomorphic;

  constructor({
    config,
    overrides,
  }: {
    config: Config;
    overrides?: OverridesConfig;
  }) {
    this.config = new MicrofrontendConfigIsomorphic({ config, overrides });
  }

  /**
   * Writes the configuration to a file.
   */
  writeConfig(
    opts: {
      pretty?: boolean;
    } = {
      pretty: true,
    },
  ): void {
    const outputPath = getOutputFilePath();

    // ensure the directory exists
    fs.mkdirSync(dirname(outputPath), { recursive: true });
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        this.config.toSchemaJson(),
        null,
        (opts.pretty ?? true) ? 2 : undefined,
      ),
    );
  }

  // --------- Static Methods ---------

  /**
   * Generates a MicrofrontendsServer instance from an unknown object.
   */
  static fromUnknown({
    config,
    cookies,
  }: {
    config: unknown;
    cookies?: { name: string; value: string }[];
  }): MicrofrontendsServer {
    const overrides = cookies ? parseOverrides(cookies) : undefined;
    if (typeof config === 'string') {
      return new MicrofrontendsServer({
        config: MicrofrontendsServer.validate(config),
        overrides,
      });
    }
    if (typeof config === 'object') {
      return new MicrofrontendsServer({
        config: config as Config,
        overrides,
      });
    }

    throw new MicrofrontendError(
      'Invalid config: must be a string or an object',
      { type: 'config', subtype: 'does_not_match_schema' },
    );
  }

  /**
   * Generates a MicrofrontendsServer instance from the environment.
   * Uses additional validation that is only available when in a node runtime
   */
  static fromEnv({
    cookies,
  }: {
    cookies: { name: string; value: string }[];
  }): MicrofrontendsServer {
    return new MicrofrontendsServer({
      config: MicrofrontendsServer.validate(getConfigStringFromEnv()),
      overrides: parseOverrides(cookies),
    });
  }

  /**
   * Validates the configuration against the JSON schema
   */
  static validate(config: string | Config): Config {
    if (typeof config === 'string') {
      const c = validateSchema(config);
      return c;
    }
    return config;
  }

  /**
   * Looks up the configuration by inferring the package root and looking for a microfrontends config file. If a file is not found,
   * it will look for a package in the repository with a microfrontends file that contains the current application
   * and use that configuration.
   *
   * This can return either a Child or Main configuration.
   */
  static infer({
    appName,
    directory,
    filePath,
    cookies,
  }: {
    appName?: string;
    directory?: string;
    filePath?: string;
    cookies?: { name: string; value: string }[];
  } = {}): MicrofrontendsServer {
    if (filePath) {
      return MicrofrontendsServer.fromFile({
        filePath,
        cookies,
      });
    }

    try {
      const packageRoot = findPackageRoot(directory);
      const applicationContext = getApplicationContext({
        appName,
        packageRoot,
      });

      // see if we have a config file at the package root
      const maybeConfig = findConfig({ dir: packageRoot });
      if (maybeConfig) {
        return MicrofrontendsServer.fromFile({
          filePath: maybeConfig,
          cookies,
        });
      }

      // if we don't have a microfrontends configuration file, see if we have another package in the repo that references this one
      const repositoryRoot = findRepositoryRoot();
      const isMonorepo = isRepositoryMonorepo({ repositoryRoot });
      // the environment variable, if specified, takes precedence over other inference methods
      if (typeof process.env.VC_MICROFRONTENDS_CONFIG === 'string') {
        const maybeConfigFromEnv = resolve(
          packageRoot,
          process.env.VC_MICROFRONTENDS_CONFIG,
        );
        if (maybeConfigFromEnv) {
          return MicrofrontendsServer.fromFile({
            filePath: maybeConfigFromEnv,
            cookies,
          });
        }
      } else {
        // when the VC_MICROFRONTENDS_CONFIG environment variable is not set, try to find the config in the .vercel directory first
        const maybeConfigFromVercel = findConfig({
          dir: join(packageRoot, '.vercel'),
        });
        if (maybeConfigFromVercel) {
          return MicrofrontendsServer.fromFile({
            filePath: maybeConfigFromVercel,
            cookies,
          });
        }

        if (isMonorepo) {
          // find the default package
          const defaultPackage = inferMicrofrontendsLocation({
            repositoryRoot,
            applicationContext,
          });

          // see if we have a config file at the package root
          const maybeConfigFromDefault = findConfig({ dir: defaultPackage });
          if (maybeConfigFromDefault) {
            return MicrofrontendsServer.fromFile({
              filePath: maybeConfigFromDefault,
              cookies,
            });
          }
        }
      }
      // will be caught below
      throw new MicrofrontendError(
        'Unable to automatically infer the location of the `microfrontends.json` file. If your Vercel Microfrontends configuration is not in this repository, you can use the Vercel CLI to pull the Vercel Microfrontends configuration using the "vercel microfrontends pull" command, or you can specify the path manually using the VC_MICROFRONTENDS_CONFIG environment variable. If you suspect this is thrown in error, please reach out to the Vercel team.',
        { type: 'config', subtype: 'inference_failed' },
      );
    } catch (e) {
      if (e instanceof MicrofrontendError) {
        throw e;
      }
      const errorMessage = e instanceof Error ? e.message : String(e);
      // we were unable to infer
      throw new MicrofrontendError(
        `Unable to locate and parse the \`microfrontends.json\` configuration file. Original error message: ${errorMessage}`,
        { cause: e, type: 'config', subtype: 'inference_failed' },
      );
    }
  }

  /*
   * Generates a MicrofrontendsServer instance from a file.
   */
  static fromFile({
    filePath,
    cookies,
  }: {
    filePath: string;
    cookies?: { name: string; value: string }[];
  }): MicrofrontendsServer {
    try {
      const configJson = fs.readFileSync(filePath, 'utf-8');
      const config = MicrofrontendsServer.validate(configJson);

      return new MicrofrontendsServer({
        config,
        overrides: cookies ? parseOverrides(cookies) : undefined,
      });
    } catch (e) {
      throw MicrofrontendError.handle(e, {
        fileName: filePath,
      });
    }
  }

  /*
   * Generates a MicrofrontendsServer instance from a file.
   */
  static fromMainConfigFile({
    filePath,
    overrides,
  }: {
    filePath: string;
    overrides?: OverridesConfig;
  }): MicrofrontendsServer {
    try {
      const config = fs.readFileSync(filePath, 'utf-8');
      const validatedConfig = MicrofrontendsServer.validate(config);
      const [defaultApplication] = Object.entries(validatedConfig.applications)
        .filter(([, app]) => isDefaultApp(app))
        .map(([name]) => name);
      // This should never get hit as MicrofrontendsServer.validate checks this if we're given a main config
      if (!defaultApplication) {
        throw new MicrofrontendError(
          'No default application found. At least one application needs to be the default by omitting routing.',
          { type: 'config', subtype: 'no_default_application' },
        );
      }
      return new MicrofrontendsServer({
        config: validatedConfig,
        overrides,
      });
    } catch (e) {
      throw MicrofrontendError.handle(e, {
        fileName: filePath,
      });
    }
  }
}

export { MicrofrontendsServer, getApplicationContext };
