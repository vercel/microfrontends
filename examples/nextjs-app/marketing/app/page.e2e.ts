import { expect, test } from '@playwright/test';

test.describe('Marketing Home Page', () => {
  test('page should load correctly', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Vercel Microfrontends' }),
    ).toBeVisible();
  });
});
