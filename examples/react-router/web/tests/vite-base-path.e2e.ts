import { test, expect } from '@playwright/test';

test.describe('Vite-base-path page (child app)', () => {
  test('page should load correctly', async ({ page }) => {
    await page.goto('/vite-base-path');
    const title = page.getByText('Hello from vite-base-path!', { exact: true });
    await expect(title).toBeVisible();
    // This ensures that the CSS resources have loaded correctly.
    await expect(title).toHaveCSS('font-size', '51.2px');
  });
});
