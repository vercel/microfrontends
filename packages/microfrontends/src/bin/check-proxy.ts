import { localProxyIsRunning } from './local-proxy-is-running';
import { logger } from './logger';

export function displayLocalProxyInfo(port: number): void {
  // TODO(olszewski): this is really icky, but since withMicroFrontends is called by two separate processes
  // we can't rely on some shared state so we instead use env to store state
  if (
    localProxyIsRunning() &&
    process.env.MFE_PROXY_MESSAGE_PRINTED !== 'true'
  ) {
    process.env.MFE_PROXY_MESSAGE_PRINTED = 'true';
    logger.info(`Microfrontends Proxy running on http://localhost:${port}`);
  }
}
