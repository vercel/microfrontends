import fs from 'node:fs';
import path from 'node:path';
import { MicrofrontendsServer } from '../config/microfrontends/server';

export interface MicrofrontendsPort {
  name: string;
  version: string;
  port: number;
  /** Whether the port was overridden via MFE_PORT env var */
  overridden?: boolean;
}

interface PortResult {
  port: number;
}

/**
 * Environment variable to override the port for local development.
 * Useful when running multiple worktrees simultaneously.
 * Note: Only works when a single application is running locally.
 */
export const MFE_APP_PORT_ENV = 'MFE_APP_PORT';

export function mfePort(packageDir: string): MicrofrontendsPort {
  const { name: appName, version } = getPackageJson(packageDir);

  // Check for port override via environment variable
  const portOverride = process.env[MFE_APP_PORT_ENV];
  if (portOverride) {
    const port = Number.parseInt(portOverride, 10);
    if (!Number.isNaN(port) && port > 0 && port < 65536) {
      return {
        name: appName,
        version,
        port,
        overridden: true,
      };
    }
  }

  try {
    const result = loadConfig({ packageDir, appName });
    const { port } = result;
    return {
      name: appName,
      version,
      port,
    };
  } catch (e) {
    throw new Error(`Unable to determine configured port for ${appName}`, {
      cause: e,
    });
  }
}

function getPackageJson(packageDir: string): { name: string; version: string } {
  const filePath = path.join(packageDir, 'package.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
    name: string;
    version: string;
  };
}

function loadConfig({
  packageDir,
  appName,
}: {
  packageDir: string;
  appName: string;
}): PortResult {
  const config = MicrofrontendsServer.infer({
    directory: packageDir,
  });
  const app = config.config.getApplication(appName);
  const port =
    app.development.local.port ??
    (app.development.local.protocol === 'https' ? 443 : 80);
  return { port };
}
