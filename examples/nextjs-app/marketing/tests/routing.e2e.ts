import { test, expect } from '@playwright/test';

test.describe('routing cases', () => {
  for (const { path, expected } of [
    {
      path: '/city/amsterdam',
      expected: '[marketing] City Page amsterdam',
    },
    {
      path: '/city/chicago',
      expected: '[docs] City Page chicago',
    },
    {
      path: '/some-123.js',
      expected: '[docs] Hash Page',
    },
    {
      path: '/foo/hello(world)',
      expected: '[docs] Foo Page hello(world)',
    },
    {
      path: '/foo/hello-world',
      expected: '[docs] Foo Page hello-world',
    },
    {
      path: '/foo/hello~world',
      expected: '[docs] Foo Page hello~world',
    },
    {
      path: '/foo/hello_world',
      expected: '[docs] Foo Page hello_world',
    },
    {
      path: '/foo/hello1',
      expected: '[docs] Foo Page hello1',
    },
    {
      path: '/foo/hello-1',
      expected: '[docs] Foo Page hello-1',
    },
    {
      path: '/foo/hello(1)',
      expected: '[docs] Foo Page hello(1)',
    },
    {
      path: '/foo/hello-3',
      expected: '[marketing] Foo Page hello-3',
    },
    {
      path: '/bar/hello(3)',
      expected: '[docs] Bar Page hello(3)',
    },
  ]) {
    test(`should have correct title for ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveText(expected);
    });
  }
});
