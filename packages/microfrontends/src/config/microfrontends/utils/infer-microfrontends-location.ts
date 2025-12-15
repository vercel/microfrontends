import { dirname, join } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { parse } from 'jsonc-parser';
import fg from 'fast-glob';
import type { Config } from '../../schema/types';
import { MicrofrontendError } from '../../errors';
import { logger } from '../../../bin/logger';
import { getPossibleConfigurationFilenames } from './get-config-file-name';
import type { ApplicationContext } from './get-application-context';

// cache the path to default configuration to avoid having to walk the file system multiple times
const configCache: Record<string, string> = {};

interface FindDefaultMicrofrontendPackageArgs {
  repositoryRoot: string;
  applicationContext: ApplicationContext;
  customConfigFilename: string | undefined;
}

/**
 * Given a repository root and a package name, find the path to the package.json file with the
 * given name.
 *
 * This method uses globby to find all package.json files and then reads them in parallel
 */
function findPackageWithMicrofrontendsConfig({
  repositoryRoot,
  applicationContext,
  customConfigFilename,
}: FindDefaultMicrofrontendPackageArgs): string | null {
  const applicationName = applicationContext.name;
  logger.debug(
    '[MFE Config] Searching repository for configs containing application:',
    applicationName,
  );

  try {
    // eslint-disable-next-line import/no-named-as-default-member
    const microfrontendsJsonPaths = fg.globSync(
      `**/{${getPossibleConfigurationFilenames({ customConfigFilename }).join(',')}}`,
      {
        cwd: repositoryRoot,
        absolute: true,
        onlyFiles: true,
        followSymbolicLinks: false,
        ignore: ['**/node_modules/**', '**/.git/**'],
      },
    );

    logger.debug(
      '[MFE Config] Found',
      microfrontendsJsonPaths.length,
      'config file(s) in repository',
    );

    const matchingPaths: string[] = [];
    for (const microfrontendsJsonPath of microfrontendsJsonPaths) {
      if (
        doesApplicationExistInConfig(microfrontendsJsonPath, applicationName)
      ) {
        matchingPaths.push(microfrontendsJsonPath);
      }
    }

    logger.debug(
      '[MFE Config] Total matching config files:',
      matchingPaths.length,
    );

    if (matchingPaths.length > 1) {
      throw new MicrofrontendError(
        `Found multiple \`microfrontends.json\` files in the repository referencing the application "${applicationName}", but only one is allowed.\n${matchingPaths.join('\n  • ')}`,
        { type: 'config', subtype: 'inference_failed' },
      );
    }

    if (matchingPaths.length === 0) {
      if (
        repositoryRoot &&
        doesMisplacedConfigExist(
          repositoryRoot,
          applicationName,
          customConfigFilename,
        )
      ) {
        logger.debug(
          '[MFE Config] Found misplaced config in wrong .vercel directory in repository',
        );
        const misplacedConfigPath = join(
          repositoryRoot,
          '.vercel',
          customConfigFilename || 'microfrontends.json',
        );
        throw new MicrofrontendError(
          `Unable to automatically infer the location of the \`microfrontends.json\` file.\n\n` +
            `A microfrontends config was found in the .vercel directory at the repository root: ${misplacedConfigPath}\n` +
            `However, in a monorepo, the config file should be placed in your application directory instead.\n\n` +
            `To fix this:\n` +
            `1. Move the config file to your application directory\n` +
            `2. Or if using \`vercel link\`, run it with \`vercel link --repo\` to handle monorepos, or run \`vercel link\` from your application directory\n` +
            `3. Alternatively, set the VC_MICROFRONTENDS_CONFIG environment variable to the correct path\n\n` +
            `For more information, see: https://vercel.com/docs/workflow-collaboration/vercel-cli#project-linking`,
          { type: 'config', subtype: 'inference_failed' },
        );
      }

      let additionalErrorMessage = '';
      if (microfrontendsJsonPaths.length > 0) {
        if (!applicationContext.projectName) {
          additionalErrorMessage = `\n\nIf the name in package.json (${applicationContext.packageJsonName}) differs from your Vercel Project name, set the \`packageName\` field for the application in \`microfrontends.json\` to ensure that the configuration can be found locally.`;
        } else {
          additionalErrorMessage = `\n\nNames of applications in \`microfrontends.json\` must match the Vercel Project name (${applicationContext.projectName}).`;
        }
      }
      throw new MicrofrontendError(
        `Could not find a \`microfrontends.json\` file in the repository that contains the "${applicationName}" application.${additionalErrorMessage}\n\n` +
          `If your Vercel Microfrontends configuration is not in this repository, you can use the Vercel CLI to pull the Vercel Microfrontends configuration using the "vercel microfrontends pull" command, or you can specify the path manually using the VC_MICROFRONTENDS_CONFIG environment variable.\n\n` +
          `If your Vercel Microfrontends configuration has a custom name, ensure the VC_MICROFRONTENDS_CONFIG_FILE_NAME environment variable is set, you can pull the vercel project environment variables using the "vercel env pull" command.\n\n` +
          `If you suspect this is thrown in error, please reach out to the Vercel team.`,
        { type: 'config', subtype: 'inference_failed' },
      );
    }

    const [packageJsonPath] = matchingPaths as [string];
    return dirname(packageJsonPath);
  } catch (error) {
    if (error instanceof MicrofrontendError) {
      throw error;
    }
    return null;
  }
}

/**
 * Given a repository root and a package name, find the path to the package directory with
 * a microfrontends config that contains the given name in its applications.
 */
export function inferMicrofrontendsLocation(
  opts: FindDefaultMicrofrontendPackageArgs,
): string {
  // cache this with name to support multiple configurations in the same repository
  const cacheKey = `${opts.repositoryRoot}-${opts.applicationContext.name}${opts.customConfigFilename ? `-${opts.customConfigFilename}` : ''}`;

  // Check if we have a cached result
  if (configCache[cacheKey]) {
    return configCache[cacheKey];
  }

  const result = findPackageWithMicrofrontendsConfig(opts);

  if (!result) {
    throw new MicrofrontendError(
      `Could not infer the location of the \`microfrontends.json\` file for application "${opts.applicationContext.name}" starting in directory "${opts.repositoryRoot}".`,
      { type: 'config', subtype: 'inference_failed' },
    );
  }

  // Cache the result
  configCache[cacheKey] = result;
  return result;
}

function existsSync(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch (_) {
    return false;
  }
}

function doesMisplacedConfigExist(
  repositoryRoot: string,
  applicationName: string,
  customConfigFilename: string | undefined,
): boolean {
  logger.debug(
    '[MFE Config] Looking for misplaced config in wrong .vercel directory',
  );
  const misplacedConfigPath = join(
    repositoryRoot,
    '.vercel',
    customConfigFilename || 'microfrontends.json',
  );
  return (
    existsSync(misplacedConfigPath) &&
    doesApplicationExistInConfig(misplacedConfigPath, applicationName)
  );
}

function doesApplicationExistInConfig(
  microfrontendsJsonPath: string,
  applicationName: string,
): boolean {
  try {
    const microfrontendsJsonContent = readFileSync(
      microfrontendsJsonPath,
      'utf-8',
    );
    const microfrontendsJson = parse(microfrontendsJsonContent) as Config;

    if (microfrontendsJson.applications[applicationName]) {
      logger.debug(
        '[MFE Config] Found application in config:',
        microfrontendsJsonPath,
      );
      return true;
    }

    for (const [_, app] of Object.entries(microfrontendsJson.applications)) {
      if (app.packageName === applicationName) {
        logger.debug(
          '[MFE Config] Found application via packageName in config:',
          microfrontendsJsonPath,
        );
        return true;
      }
    }
  } catch (error) {
    logger.debug('[MFE Config] Error checking application in config:', error);
    // malformed json most likely, skip this file
  }
  return false;
}
