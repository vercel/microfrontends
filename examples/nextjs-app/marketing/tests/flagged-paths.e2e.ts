import { test, expect, type BrowserContext } from '@playwright/test';
import { encrypt } from 'flags';

const FEATURE_FLAGS_COOKIE_NAME = 'vercel-flag-overrides';

/**
 * Sets flag overrides that work with the `flags` package.
 *
 * @param test - The test instance.
 * @param flags - The flags to override.
 */
async function setFlagOverrides(
  baseUrl: string,
  context: BrowserContext,
  flags: Record<string, unknown>,
): Promise<void> {
  const flagsSecret = process.env.FLAGS_SECRET;
  if (!flagsSecret) {
    throw new Error(
      'Cannot call setFlags without `FLAGS_SECRET` environment variable defined.',
    );
  }

  const encryptedFlags = await encrypt(flags, flagsSecret);
  await context.addCookies([
    {
      name: FEATURE_FLAGS_COOKIE_NAME,
      value: encryptedFlags,
      path: '/',
      domain: new URL(baseUrl).hostname,
    },
  ]);
}

test.describe('Flagged Paths', () => {
  test('Flagged docs page should load correctly when experiment is active', async ({
    baseURL,
    context,
    page,
  }) => {
    if (!baseURL) {
      throw new Error('`BASE_URL` environment variable is required');
    }
    await setFlagOverrides(baseURL, context, {
      'is-flagged-docs-path-enabled': true,
    });
    await page.goto('/flagged/docs');
    await expect(
      page.getByRole('heading', { name: 'Flagged Path', exact: true }),
    ).toBeVisible();
  });

  test('Flagged docs page should not load when experiment is inactive', async ({
    baseURL,
    context,
    page,
  }) => {
    if (!baseURL) {
      throw new Error('`BASE_URL` environment variable is required');
    }
    await setFlagOverrides(baseURL, context, {
      'is-flagged-docs-path-enabled': false,
    });
    const response = await page.goto('/flagged/docs');
    expect(response?.status()).toBe(404);
  });

  test('/flagged/docs flagged path should run server action', async ({
    baseURL,
    context,
    page,
  }) => {
    if (!baseURL) {
      throw new Error('`BASE_URL` environment variable is required');
    }
    await setFlagOverrides(baseURL, context, {
      'is-flagged-docs-path-enabled': true,
    });
    await page.goto('/flagged/docs');
    await expect(
      page.getByText(
        'This content should be replaced with server response after click.',
      ),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Run server action' }).click();
    await expect(page.getByText('Hello from the server!')).toBeVisible();
    await expect(
      page.getByText(
        'This content should be replaced with server response after click.',
      ),
    ).not.toBeVisible();
  });
});
