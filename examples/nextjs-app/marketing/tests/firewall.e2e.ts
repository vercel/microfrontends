import { test, expect } from '@playwright/test';

test.describe('Firewall behavior', () => {
  test.describe('Firewall rules in parent app', () => {
    test('Runs parent Firewall rules on child pages', async ({
      baseURL,
      extraHTTPHeaders,
    }) => {
      const response = await fetch(
        `${baseURL}/docs/test/firewall/parent-blocked-page`,
        {
          headers: {
            ...extraHTTPHeaders,
            'user-agent': 'microfrontends e2e test',
          },
          redirect: 'manual',
        },
      );
      expect(response.status).toBe(403);
    });
  });

  test.describe('Firewall rules in child app', () => {
    test('Firewall rule in child blocks pages', async ({
      baseURL,
      extraHTTPHeaders,
    }) => {
      const response = await fetch(
        `${baseURL}/docs/test/firewall/child-blocked-page`,
        {
          headers: {
            ...extraHTTPHeaders,
            'user-agent': 'microfrontends e2e test',
          },
          redirect: 'manual',
        },
      );
      expect(response.status).toBe(403);
    });

    test('Firewall rule in child app has no effect on pages served by parent', async ({
      baseURL,
      extraHTTPHeaders,
    }) => {
      const response = await fetch(`${baseURL}`, {
        headers: {
          ...extraHTTPHeaders,
          'user-agent': 'microfrontends e2e test',
        },
        redirect: 'manual',
      });
      expect(response.status).toBe(200);
    });
  });
});
