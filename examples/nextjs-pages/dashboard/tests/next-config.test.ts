/* @jest-environment node */

import {
  expandWildcards,
  getAllMicrofrontendPaths,
  loadMicrofrontendConfigForEdge,
} from '@vercel/microfrontends/next/testing';
import {
  getRedirectUrl,
  getRewrittenUrl,
  unstable_getResponseFromNextConfig,
} from 'next/experimental/testing/server';

type Env = 'development' | 'preview' | 'production';

describe('next.config.ts', () => {
  const environments: Env[] = ['development', 'preview', 'production'];

  for (const env of environments) {
    describe(`when VERCEL_ENV is '${env}'`, () => {
      let nextConfig: typeof import('../next.config').default;

      beforeAll(async () => {
        // Set the environment variable before importing nextConfig
        process.env.VERCEL_ENV = env;

        // Clear the module cache to ensure nextConfig picks up the new env var
        jest.resetModules();

        // Dynamically import nextConfig after setting the environment variable
        nextConfig = (await import('../next.config')).default;
      });

      it('next.config.js redirects and rewrites should not match any microfrontend path', async () => {
        const mfeConfig = loadMicrofrontendConfigForEdge(
          './microfrontends.json',
        );
        const allPaths = [...getAllMicrofrontendPaths(mfeConfig)];
        const errors = [];
        for (const path of allPaths) {
          for (const concretePath of expandWildcards(path)) {
            const response = await unstable_getResponseFromNextConfig({
              url: concretePath,
              nextConfig,
            });
            if (getRedirectUrl(response) || getRewrittenUrl(response)) {
              errors.push(
                `Path "${concretePath}" should not match any redirect or rewrite in next.config.js`,
              );
              // Only report the first error for each expanded wildcard.
              break;
            }
          }
        }
        expect(errors).toEqual([]);
      });
    });
  }
});
