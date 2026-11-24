import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import { bypassStorageStatePath } from './bypass-state';

const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  throw new Error('process.env.BASE_URL is not set');
}

const baseURL = BASE_URL.replace(/\/$/, '');
const protectionBypass = process.env.DEPLOYMENT_PROTECTION_BYPASS ?? '';

function moduleDir(): string {
  try {
    if (typeof __dirname === 'string') return __dirname;
  } catch {
    // ESM has no __dirname.
  }
  return dirname(fileURLToPath(import.meta.url));
}

function globalSetupPath(): string {
  const dir = moduleDir();
  const found = ['global-setup.cjs', 'global-setup.js']
    .map((name) => join(dir, name))
    .find((path) => existsSync(path));
  if (!found) {
    throw new Error(`Cannot find global-setup in ${dir}`);
  }
  return found;
}

// Reference: https://playwright.dev/docs/test-configuration
export const playwrightConfig: PlaywrightTestConfig = {
  testMatch: '*.e2e.ts',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  testDir: './',
  outputDir: 'e2e-test-results/',
  // Prefetches cannot send extraHTTPHeaders.
  globalSetup: protectionBypass ? globalSetupPath() : undefined,

  use: {
    baseURL, // make sure there's no slash at the end
    storageState: protectionBypass
      ? bypassStorageStatePath(baseURL)
      : undefined,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': protectionBypass,
    },

    // Retry a test if its failing with enabled tracing. This allows you to analyse the DOM, console logs, network traffic etc.
    // More information: https://playwright.dev/docs/trace-viewer
    trace: 'retry-with-trace',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        bypassCSP: true,
      },
    },
  ],
};
