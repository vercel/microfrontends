import { test, expect } from '@playwright/test';

test.describe('Microfrontends Link', () => {
  test('microfrontends link works correctly', async ({ page }) => {
    await page.goto('/docs');
    const backToHomeElement = page.getByRole('link', {
      name: 'Back to Home',
    });
    await expect(backToHomeElement).toBeVisible();

    const homeZoneDataAttribute =
      await backToHomeElement.getAttribute('data-zone');
    expect(homeZoneDataAttribute).toBe('d14d6d');

    const examplesElement = page.getByRole('link', { name: 'Examples' });
    await expect(examplesElement).toBeVisible();
    const examplesZoneDataAttribute =
      await examplesElement.getAttribute('data-zone');
    expect(examplesZoneDataAttribute).toBe('null');

    await backToHomeElement.click();
    await page.waitForURL('/');
    await expect(
      page.getByRole('heading', { name: 'Vercel Microfrontends' }),
    ).toBeVisible();
  });
});
