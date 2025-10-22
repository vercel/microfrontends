/* @jest-environment node */

import { validateRouting } from '@vercel/microfrontends/next/testing';

describe('microfrontends', () => {
  test('routing', () => {
    expect(() =>
      validateRouting('./microfrontends.jsonc', {
        'nextjs-app-marketing': ['/', '/city/amsterdam', '/flagged/docs'],
        'nextjs-app-docs': [
          '/docs',
          '/docs/',
          '/docs/other',
          '/docs/and/more/',
          { path: '/flagged/docs', flag: 'is-flagged-docs-path-enabled' },
          '/some-anything.js',
          '/some-else.js',
          '/city/brooklyn',
        ],
      }),
    ).not.toThrow();
  });
});
