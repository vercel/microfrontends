import { expect, test } from '@playwright/test';

test.describe('Docs page (child app)', () => {
  test('page should load correctly', async ({ page }) => {
    await page.goto('/docs');
    const title = page.getByText('Microfrontends Docs', { exact: true });
    await expect(title).toBeVisible();
    // This ensures that the CSS resources have loaded correctly.
    await expect(title).toHaveCSS('font-size', '20px');
  });
});
