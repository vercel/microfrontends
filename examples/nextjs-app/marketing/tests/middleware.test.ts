/* @jest-environment node */

import {
  validateMiddlewareConfig,
  validateMiddlewareOnFlaggedPaths,
} from '@vercel/microfrontends/next/testing';
import { config, middleware } from '../middleware';

jest.mock('flags/next', () => ({
  flag: jest.fn().mockReturnValue(jest.fn().mockResolvedValue(true)),
}));

describe('middleware', () => {
  test('matches microfrontends paths', () => {
    expect(() =>
      validateMiddlewareConfig(config, './microfrontends-custom.jsonc'),
    ).not.toThrow();
  });

  test('rewrites for flagged paths', async () => {
    await expect(
      validateMiddlewareOnFlaggedPaths(
        './microfrontends-custom.jsonc',
        middleware,
      ),
    ).resolves.not.toThrow();
  });
});
