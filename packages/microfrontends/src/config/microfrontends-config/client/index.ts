import { pathToRegexp } from 'path-to-regexp';
import type { ClientConfig } from './types';

export interface MicrofrontendConfigClientOptions {
  removeFlaggedPaths?: boolean;
}

const regexpCache = new Map<string, RegExp>();
const getRegexp = (path: string): RegExp => {
  const existing = regexpCache.get(path);
  if (existing) {
    return existing;
  }

  const regexp = pathToRegexp(path);
  regexpCache.set(path, regexp);
  return regexp;
};

export class MicrofrontendConfigClient {
  applications: ClientConfig['applications'];
  hasFlaggedPaths: boolean;
  pathCache: Record<string, string> = {};
  private readonly serialized: ClientConfig;

  constructor(config: ClientConfig, opts?: MicrofrontendConfigClientOptions) {
    this.hasFlaggedPaths = config.hasFlaggedPaths ?? false;
    for (const app of Object.values(config.applications)) {
      if (app.routing) {
        if (app.routing.some((match) => match.flag)) {
          this.hasFlaggedPaths = true;
        }
        const newRouting = [];
        const pathsWithoutFlags = [];
        for (const group of app.routing) {
          if (group.flag) {
            if (opts?.removeFlaggedPaths) {
              continue;
            }
            if (group.group) {
              delete group.group;
            }
            newRouting.push(group);
          } else {
            pathsWithoutFlags.push(...group.paths);
          }
        }
        if (pathsWithoutFlags.length > 0) {
          newRouting.push({ paths: pathsWithoutFlags });
        }
        app.routing = newRouting;
      }
    }
    this.serialized = config;
    if (this.hasFlaggedPaths) {
      this.serialized.hasFlaggedPaths = this.hasFlaggedPaths;
    }
    this.applications = config.applications;
  }

  /**
   * Create a new `MicrofrontendConfigClient` from a JSON string.
   * Config must be passed in to remain framework agnostic
   */
  static fromEnv(config: string | undefined): MicrofrontendConfigClient {
    if (!config) {
      throw new Error(
        'Could not construct MicrofrontendConfigClient: configuration is empty or undefined. Did you set up your application with `withMicrofrontends`? Is the local proxy running and this application is being accessed via the proxy port? See https://vercel.com/docs/microfrontends/local-development#setting-up-microfrontends-proxy',
      );
    }
    return new MicrofrontendConfigClient(JSON.parse(config) as ClientConfig);
  }

  isEqual(other: MicrofrontendConfigClient): boolean {
    return (
      this === other ||
      JSON.stringify(this.applications) === JSON.stringify(other.applications)
    );
  }

  getApplicationNameForPath(path: string): string | null {
    if (!path.startsWith('/')) {
      throw new Error(`Path must start with a /`);
    }

    if (this.pathCache[path]) {
      return this.pathCache[path];
    }

    const pathname = new URL(path, 'https://example.com').pathname;
    for (const [name, application] of Object.entries(this.applications)) {
      if (application.routing) {
        for (const group of application.routing) {
          for (const childPath of group.paths) {
            const regexp = getRegexp(childPath);
            if (regexp.test(pathname)) {
              this.pathCache[path] = name;
              return name;
            }
          }
        }
      }
    }
    const defaultApplication = Object.entries(this.applications).find(
      ([, application]) => application.default,
    );
    if (!defaultApplication) {
      return null;
    }

    this.pathCache[path] = defaultApplication[0];
    return defaultApplication[0];
  }

  serialize(): ClientConfig {
    return this.serialized;
  }
}
