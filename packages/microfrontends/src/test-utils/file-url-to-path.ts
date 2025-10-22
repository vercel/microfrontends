import { fileURLToPath as fUTP } from 'node:url';

/**
 * Wrap fileURLToPath to path to patch a behavior difference between 18 and 20+
 */
export function fileURLToPath(url: URL | string): string {
  if (typeof url === 'string') {
    return fUTP(url);
  }
  return fUTP(url.toString());
}
