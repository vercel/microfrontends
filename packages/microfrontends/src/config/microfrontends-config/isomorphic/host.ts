import type {
  HostConfig as RemoteHostConfigSchema,
  LocalHostConfig as LocalHostConfigSchema,
} from '../../../bin/types';
import { generatePortFromName } from './utils/generate-port';

interface HostOptions {
  isLocal?: boolean;
}

export class Host {
  protocol: 'http' | 'https';
  host: string;
  port?: number;
  local: boolean | undefined;

  constructor(
    hostConfig: RemoteHostConfigSchema | string,
    options?: HostOptions,
  ) {
    if (typeof hostConfig === 'string') {
      ({
        protocol: this.protocol,
        host: this.host,
        port: this.port,
      } = Host.parseUrl(hostConfig));
    } else {
      const { protocol = 'https', host, port } = hostConfig;
      this.protocol = protocol;
      this.host = host;
      this.port = port;
    }
    this.local = options?.isLocal;
  }

  protected static parseUrl(
    url: string,
    defaultProtocol = 'https',
  ): {
    protocol: Host['protocol'];
    host: string;
    port?: number;
  } {
    let hostToParse = url;
    if (!/^https?:\/\//.exec(hostToParse)) {
      hostToParse = `${defaultProtocol}://${hostToParse}`;
    }
    const parsed = new URL(hostToParse);
    if (!parsed.hostname) {
      throw new Error(Host.getMicrofrontendsError(url, 'requires a host'));
    }
    if (parsed.hash) {
      throw new Error(
        Host.getMicrofrontendsError(url, 'cannot have a fragment'),
      );
    }
    if (parsed.username || parsed.password) {
      throw new Error(
        Host.getMicrofrontendsError(
          url,
          'cannot have authentication credentials (username and/or password)',
        ),
      );
    }
    if (parsed.pathname !== '/') {
      throw new Error(Host.getMicrofrontendsError(url, 'cannot have a path'));
    }
    if (parsed.search) {
      throw new Error(
        Host.getMicrofrontendsError(url, 'cannot have query parameters'),
      );
    }
    const protocol = parsed.protocol.slice(0, -1) as Host['protocol'];
    return {
      protocol,
      host: parsed.hostname,
      port: parsed.port ? Number.parseInt(parsed.port) : undefined,
    };
  }

  private static getMicrofrontendsError(url: string, message: string): string {
    return `Microfrontends configuration error: the URL ${url} in your microfrontends.json ${message}.`;
  }

  isLocal(): boolean {
    return this.local || this.host === 'localhost' || this.host === '127.0.0.1';
  }

  toString(): string {
    const url = this.toUrl();
    // strip the trailing slash
    return url.toString().replace(/\/$/, '');
  }

  toUrl(): URL {
    const url = `${this.protocol}://${this.host}${this.port ? `:${this.port}` : ''}`;
    return new URL(url);
  }
}

/**
 * A Host subclass with defaults for locally running applications
 */
export class LocalHost extends Host {
  constructor({
    appName,
    local,
  }: {
    appName: string;
    local?: string | number | LocalHostConfigSchema;
  }) {
    let protocol: RemoteHostConfigSchema['protocol'];
    let host: string | undefined;
    let port: number | undefined;
    if (typeof local === 'number') {
      port = local;
    } else if (typeof local === 'string') {
      if (/^\d+$/.test(local)) {
        port = Number.parseInt(local);
      } else {
        const parsed = Host.parseUrl(local, 'http');
        protocol = parsed.protocol;
        host = parsed.host;
        port = parsed.port;
      }
    } else if (local) {
      protocol = local.protocol;
      host = local.host;
      port = local.port;
    }
    // set defaults for local
    super({
      protocol: protocol ?? 'http',
      host: host ?? 'localhost',
      port: port ?? generatePortFromName({ name: appName }),
    });
  }
}
