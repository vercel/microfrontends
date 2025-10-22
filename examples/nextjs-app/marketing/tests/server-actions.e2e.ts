import { test, expect } from '@playwright/test';

test.describe('Server Actions (child)', () => {
  test('Server actions in child app work correctly', async ({ page }) => {
    await page.goto('/docs/server-actions');
    const button = page.getByRole('button', {
      name: 'Run Server Action',
    });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByText('Hello from the server!')).toBeVisible();
  });
});
