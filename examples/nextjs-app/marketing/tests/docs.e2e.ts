import { test, expect } from '@playwright/test';

test.describe('Docs app (child)', () => {
  test('page should load correctly', async ({ page }) => {
    await page.goto('/docs');
    await expect(
      page.getByRole('heading', { name: 'Vercel Microfrontends Docs' }),
    ).toBeVisible();
  });

  test('image should load correctly', async ({ page }) => {
    await page.goto('/docs');
    const image = page.getByRole('img', { name: 'MFE Icon' });
    await expect(image).toBeVisible();
    const src = await image.getAttribute('src');
    expect(src).toMatch(
      /^\/nextjs-app-docs\/_next\/image\?url=%2Fnextjs-app-docs%2F_next%2Fstatic%2Fmedia%2Fmfe-icon-dark\.[a-z0-9]{8}\.png&w=64&q=75$/,
    );
    const imageResponse = await page.request.get(src || '');
    expect(imageResponse.status()).toBe(200);
  });
});
