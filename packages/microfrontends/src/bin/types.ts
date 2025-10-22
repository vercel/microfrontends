export interface HostConfig {
  protocol?: 'http' | 'https';
  host: string;
  port?: number;
}

export type LocalHostConfig = Omit<HostConfig, 'host'> & {
  host?: string;
};

export interface LocalProxyOptions {
  localApps: string[];
  names?: string[];
  port?: number;
}

export interface LocalProxyApplicationResponse {
  routing: HostConfig;
}
