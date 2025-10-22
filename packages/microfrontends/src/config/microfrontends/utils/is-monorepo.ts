import fs from 'node:fs';
import path from 'node:path';

/**
 * Given a repository root, determine if the repository is using the workspace feature of any package manager.
 *
 * Supports npm, yarn, pnpm, bun, and vlt
 */
export function isMonorepo({
  repositoryRoot,
}: {
  repositoryRoot: string;
}): boolean {
  try {
    // pnpm can be validated just by the existence of the pnpm-workspace.yaml file
    if (fs.existsSync(path.join(repositoryRoot, 'pnpm-workspace.yaml'))) {
      return true;
    }

    // vlt can be validated just by the existence of the vlt-workspaces.json file
    if (fs.existsSync(path.join(repositoryRoot, 'vlt-workspaces.json'))) {
      return true;
    }

    // NX can be validated by checking the environment variable.
    if (process.env.NX_WORKSPACE_ROOT === path.resolve(repositoryRoot)) {
      return true;
    }

    // all the rest need packages defined in root package.json
    const packageJsonPath = path.join(repositoryRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8'),
    ) as {
      workspaces?: string[] | Record<string, string>;
    };

    return packageJson.workspaces !== undefined;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error determining if repository is a monorepo', error);
    return false;
  }
}
