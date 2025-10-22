import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

export type Framework = 'sveltekit' | 'react-router' | 'unknown';

export function detectFramework(): Framework {
  if (existsSync(join(cwd(), 'svelte.config.js'))) {
    return 'sveltekit';
  }
  if (
    existsSync(join(cwd(), 'react-router.config.js')) ||
    existsSync(join(cwd(), 'react-router.config.ts'))
  ) {
    return 'react-router';
  }
  return 'unknown';
}
