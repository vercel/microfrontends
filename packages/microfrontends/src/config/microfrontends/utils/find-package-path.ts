import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import fg from 'fast-glob';

// cache the path to default configuration to avoid having to walk the file system multiple times
const configCache: Record<string, string> = {};

interface FindPackagePathOptions {
  repositoryRoot: string;
  name: string;
}

/**
 * Given a repository root and a package name, find the path to the package.json file with the
 * given name.
 *
 * This method uses globby to find all package.json files and then reads them in parallel
 */
function findPackagePathWithGlob({
  repositoryRoot,
  name,
}: FindPackagePathOptions): string | null {
  try {
    const packageJsonPaths = fg.globSync('**/package.json', {
      cwd: repositoryRoot,
      absolute: true,
      onlyFiles: true,
      followSymbolicLinks: false,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });

    const matchingPaths: string[] = [];
    for (const packageJsonPath of packageJsonPaths) {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent) as {
        name?: string;
      };

      if (packageJson.name === name) {
        matchingPaths.push(packageJsonPath);
      }
    }

    if (matchingPaths.length > 1) {
      throw new Error(
        `Found multiple packages with the name "${name}" in the repository: ${matchingPaths.join(', ')}`,
      );
    }

    if (matchingPaths.length === 0) {
      throw new Error(
        `Could not find package with the name "${name}" in the repository`,
      );
    }

    const [packageJsonPath] = matchingPaths as [string];
    return dirname(packageJsonPath);
  } catch (error) {
    return null;
  }
}

/**
 * Given a repository root and a package name, find the path to the package directory with
 * a package.json that contains the given name.
 */
export function findPackagePath(opts: FindPackagePathOptions): string {
  // cache this with name to support multiple configurations in the same repository
  const cacheKey = `${opts.repositoryRoot}-${opts.name}`;

  // Check if we have a cached result
  if (configCache[cacheKey]) {
    return configCache[cacheKey];
  }

  // Race both methods
  const result = findPackagePathWithGlob(opts);

  if (!result) {
    throw new Error(
      `Could not find package with the name "${opts.name}" in the repository`,
    );
  }

  // Cache the result
  configCache[cacheKey] = result;
  return result;
}
