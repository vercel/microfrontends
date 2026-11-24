import { expect, test } from '@playwright/test';

// Not extraHTTPHeaders: the bypass-cookie header would turn responses into 307s.
const headers = {
  'x-vercel-protection-bypass': process.env.DEPLOYMENT_PROTECTION_BYPASS ?? '',
  'user-agent': 'microfrontends e2e test',
};

test.describe('Firewall behavior', () => {
  test.describe('Firewall rules in parent app', () => {
    test('Runs parent Firewall rules on child pages', async ({ baseURL }) => {
      const response = await fetch(
        `${baseURL}/docs/test/firewall/parent-blocked-page`,
        { headers, redirect: 'manual' },
      );
      expect(response.status).toBe(403);
    });
  });

  test.describe('Firewall rules in child app', () => {
    test('Firewall rule in child blocks pages', async ({ baseURL }) => {
      const response = await fetch(
        `${baseURL}/docs/test/firewall/child-blocked-page`,
        { headers, redirect: 'manual' },
      );
      expect(response.status).toBe(403);
    });

    test('Firewall rule in child app has no effect on pages served by parent', async ({
      baseURL,
    }) => {
      const response = await fetch(`${baseURL}`, {
        headers,
        redirect: 'manual',
      });
      expect(response.status).toBe(200);
    });
  });
});
