import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('page should load correctly', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        name: 'Microfrontends Made Simple',
        exact: true,
      }),
    ).toBeVisible();
  });
});
