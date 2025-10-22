import fs from 'node:fs';
import path from 'node:path';

const PACKAGE_JSON = 'package.json';

/**
 * Find the package root by looking for the closest package.json.
 *
 */
export function findPackageRoot(startDir?: string): string {
  let currentDir = startDir || process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    const pkgJsonPath = path.join(currentDir, PACKAGE_JSON);

    // Check for a .git directory (not a file)
    if (fs.existsSync(pkgJsonPath)) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  throw new Error(
    `The root of the package that contains the \`package.json\` file for the \`${startDir}\` directory could not be found.`,
  );
}
