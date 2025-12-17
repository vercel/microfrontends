import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../../../bin/logger';
import { MicrofrontendError } from '../../errors';

export interface ApplicationContext {
  name: string;
  projectName?: string;
  packageJsonName?: string;
}

/**
 * Returns the application name and any additional context that we need.
 */
export function getApplicationContext(opts?: {
  appName?: string;
  packageRoot?: string;
}): ApplicationContext {
  if (opts?.appName) {
    logger.debug(
      '[MFE Config] Application name from appName parameter:',
      opts.appName,
    );
    return { name: opts.appName };
  }

  if (process.env.VERCEL_PROJECT_NAME) {
    logger.debug(
      '[MFE Config] Application name from VERCEL_PROJECT_NAME:',
      process.env.VERCEL_PROJECT_NAME,
    );
    return {
      name: process.env.VERCEL_PROJECT_NAME,
      projectName: process.env.VERCEL_PROJECT_NAME,
    };
  }

  // If this is NX, there are many different places the name can be and they
  // might not even have a package.json. Use the environment variable, which
  // relies on NX's logic to find the name.
  if (process.env.NX_TASK_TARGET_PROJECT) {
    logger.debug(
      '[MFE Config] Application name from NX_TASK_TARGET_PROJECT:',
      process.env.NX_TASK_TARGET_PROJECT,
    );
    return {
      name: process.env.NX_TASK_TARGET_PROJECT,
      packageJsonName: process.env.NX_TASK_TARGET_PROJECT,
    };
  }

  try {
    const vercelProjectJsonPath = fs.readFileSync(
      path.join(opts?.packageRoot || '.', '.vercel', 'project.json'),
      'utf-8',
    );
    const projectJson = JSON.parse(vercelProjectJsonPath) as {
      projectName?: string;
    };
    if (projectJson.projectName) {
      logger.debug(
        '[MFE Config] Application name from .vercel/project.json:',
        projectJson.projectName,
      );
      return {
        name: projectJson.projectName,
        projectName: projectJson.projectName,
      };
    }
  } catch (_) {
    // If we couldn't read the .vercel/project.json file, fall back to the package.json
  }

  try {
    // load the package.json for the application
    const packageJsonString = fs.readFileSync(
      path.join(opts?.packageRoot || '.', 'package.json'),
      'utf-8',
    );
    const packageJson = JSON.parse(packageJsonString) as { name?: string };

    if (!packageJson.name) {
      throw new MicrofrontendError(
        `package.json file missing required field "name"`,
        {
          type: 'packageJson',
          subtype: 'missing_field_name',
          source: '@vercel/microfrontends/next',
        },
      );
    }

    logger.debug(
      '[MFE Config] Application name from package.json:',
      packageJson.name,
    );
    return { name: packageJson.name, packageJsonName: packageJson.name };
  } catch (err) {
    throw MicrofrontendError.handle(err, {
      fileName: 'package.json',
    });
  }
}
