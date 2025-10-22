import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  throw new Error('process.env.BASE_URL is not set');
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

  use: {
    baseURL: BASE_URL.replace(/\/$/, ''), // make sure there's no slash at the end
    extraHTTPHeaders: {
      'x-vercel-protection-bypass':
        process.env.DEPLOYMENT_PROTECTION_BYPASS ?? '',
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
