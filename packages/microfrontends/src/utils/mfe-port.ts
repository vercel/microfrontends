import path from 'node:path';
import fs from 'node:fs';
import { MicrofrontendsServer } from '../config/microfrontends/server';

export interface MicrofrontendsPort {
  name: string;
  version: string;
  port: number;
}

interface PortResult {
  port: number;
}

export function mfePort(packageDir: string): MicrofrontendsPort {
  const { name: appName, version } = getPackageJson(packageDir);
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
