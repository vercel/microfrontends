import { dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse } from 'jsonc-parser';
import fg from 'fast-glob';
import type { Config } from '../../schema/types';
import { MicrofrontendError } from '../../errors';
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

    const matchingPaths: string[] = [];
    for (const microfrontendsJsonPath of microfrontendsJsonPaths) {
      try {
        const microfrontendsJsonContent = readFileSync(
          microfrontendsJsonPath,
          'utf-8',
        );
        const microfrontendsJson = parse(microfrontendsJsonContent) as Config;

        if (microfrontendsJson.applications[applicationName]) {
          matchingPaths.push(microfrontendsJsonPath);
        } else {
          for (const [_, app] of Object.entries(
            microfrontendsJson.applications,
          )) {
            if (app.packageName === applicationName) {
              matchingPaths.push(microfrontendsJsonPath);
            }
          }
        }
      } catch (error) {
        // malformed json most likely, skip this file
      }
    }

    if (matchingPaths.length > 1) {
      throw new MicrofrontendError(
        `Found multiple \`microfrontends.json\` files in the repository referencing the application "${applicationName}", but only one is allowed.\n${matchingPaths.join('\n  • ')}`,
        { type: 'config', subtype: 'inference_failed' },
      );
    }

    if (matchingPaths.length === 0) {
      let additionalErrorMessage = '';
      if (microfrontendsJsonPaths.length > 0) {
        if (!applicationContext.projectName) {
          additionalErrorMessage = `\n\nIf the name in package.json (${applicationContext.packageJsonName}) differs from your Vercel Project name, set the \`packageName\` field for the application in \`microfrontends.json\` to ensure that the configuration can be found locally.`;
        } else {
          additionalErrorMessage = `\n\nNames of applications in \`microfrontends.json\` must match the Vercel Project name (${applicationContext.projectName}).`;
        }
      }
      throw new MicrofrontendError(
        `Could not find a \`microfrontends.json\` file in the repository that contains the "${applicationName}" application.${additionalErrorMessage}\n\nIf your Vercel Microfrontends configuration is not in this repository, you can use the Vercel CLI to pull the Vercel Microfrontends configuration using the "vercel microfrontends pull" command, or you can specify the path manually using the VC_MICROFRONTENDS_CONFIG environment variable.\n\nIf you suspect this is thrown in error, please reach out to the Vercel team.`,
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
