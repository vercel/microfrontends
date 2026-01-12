import { cwd } from 'node:process';
import type { MicrofrontendsPort } from '../utils/mfe-port';
import { MFE_PORT_ENV, mfePort } from '../utils/mfe-port';
import { logger } from './logger';

/**
 * Prints port for current application to stdout along with a header on stderr.
 * Assumes cwd is the package directory for the current application.
 */
export function displayPort(): void {
  // Don't log any debug information when computing the port to use.
  delete process.env.MFE_DEBUG;
  const portInfo = mfePort(cwd());
  header(portInfo);
  logger.info(portInfo.port);
}

/**
 * Use stderr to print the header message so that it doesn't interfere with the
 * output of the command.
 */
function header({ name, version, port, overridden }: MicrofrontendsPort): void {
  const portSource = overridden
    ? `${port} (override via ${MFE_PORT_ENV})`
    : port;
  logger.error(`
  ▲ ${name}@${version}
    · setting port to ${portSource}
  `);
}
