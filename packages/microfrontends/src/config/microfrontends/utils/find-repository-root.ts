import fs from 'node:fs';
import path from 'node:path';

const GIT_DIRECTORY = '.git';

function hasGitDirectory(dir: string): boolean {
  const gitPath = path.join(dir, GIT_DIRECTORY);

  // Check for a .git directory (not a file)
  return fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory();
}

function hasPnpmWorkspaces(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'));
}

function hasPackageJson(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'package.json'));
}

/**
 * Find the root of the repository by looking for a `.git` directory or pnpm workspace.
 * If neither is found, falls back to the topmost directory containing a package.json file.
 * This should work with submodules as well as it verifies that the `.git` directory is a
 * directory and not a file.
 */
export function findRepositoryRoot(startDir?: string): string {
  if (process.env.NX_WORKSPACE_ROOT) {
    // Trust NX's workspace root here so we don't have to rely on finding a .git
    // directory. There are some places (like the `vercel deploy` CLI command)
    // where the .git directory doesn't exist.
    return process.env.NX_WORKSPACE_ROOT;
  }

  let currentDir = startDir || process.cwd();
  let lastPackageJsonDir: string | null = null;

  while (currentDir !== path.parse(currentDir).root) {
    if (hasGitDirectory(currentDir) || hasPnpmWorkspaces(currentDir)) {
      return currentDir;
    }

    if (hasPackageJson(currentDir)) {
      lastPackageJsonDir = currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  // If we found a package.json directory, use that as the root
  if (lastPackageJsonDir) {
    return lastPackageJsonDir;
  }

  throw new Error(
    `Could not find the root of the repository for ${startDir}. Please ensure that the directory is part of a Git repository. If you suspect that this should work, please file an issue to the Vercel team.`,
  );
}
