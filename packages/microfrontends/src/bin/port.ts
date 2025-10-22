import { cwd } from 'node:process';
import { mfePort } from '../utils/mfe-port';
import type { MicrofrontendsPort } from '../utils/mfe-port';

/**
 * Prints port for current application to stdout along with a header on stderr.
 * Assumes cwd is the package directory for the current application.
 */
export function displayPort(): void {
  const portInfo = mfePort(cwd());
  header(portInfo);
  // eslint-disable-next-line no-console
  console.log(portInfo.port);
}

/**
 * Use stderr to print the header message so that it doesn't interfere with the
 * output of the command.
 */
function header({ name, version, port }: MicrofrontendsPort): void {
  // eslint-disable-next-line no-console
  console.error(`
  ▲ ${name}@${version}
    · setting port to ${port}
  `);
}
