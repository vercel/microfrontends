import { join } from 'node:path';
import type { NextConfig } from 'next';
import { MicrofrontendsServer } from '../../config/microfrontends/server';
import { fileURLToPath } from '../../test-utils/file-url-to-path';
import { withMicrofrontends } from '.';

const fixtures = fileURLToPath(
  new URL('../../config/__fixtures__', import.meta.url),
);
const originalCwd = process.cwd();

describe('withMicrofrontends', () => {
  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('runs all transforms for default app', () => {
    const nextConfig = {} as NextConfig;
    const result = withMicrofrontends(nextConfig, {
      appName: 'vercel-site',
      configPath: join(fixtures, 'simple.jsonc'),
    });

    // verify each transform

    // 1. assetPrefix (should be undefined for default app)
    expect(result.assetPrefix).toBeUndefined();
    // 2. rewrites (just verify it exists and let the rewrites transform tests verify content)
    expect(result.rewrites).toBeDefined();
    // 3. webpack (just verify it exists)
    expect(result.webpack).toBeDefined();
  });

  it('runs all transforms for non-default app', () => {
    const nextConfig = {} as NextConfig;
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });

    const result = withMicrofrontends(nextConfig, {
      appName: 'vercel-marketing',
      configPath: join(fixtures, 'simple.jsonc'),
    });

    // verify each transform

    // 1. assetPrefix
    expect(result.assetPrefix).toBeDefined();
    expect(result.assetPrefix).toEqual(
      `/${microfrontends.config.getApplication('vercel-marketing').getAssetPrefix()}`,
    );
    // 2. rewrites (just verify it exists and let the rewrites transform tests verify content)
    expect(result.rewrites).toBeDefined();
    // 3. webpack (just verify it exists)
    expect(result.webpack).toBeDefined();
  });

  it('supports skipping transforms', () => {
    const nextConfig = {} as NextConfig;
    const microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });
    const result = withMicrofrontends(nextConfig, {
      appName: 'vercel-marketing',
      skipTransforms: ['rewrites', 'webpack'],
      configPath: join(fixtures, 'simple.jsonc'),
    });

    // verify each transform

    // 1. assetPrefix
    expect(result.assetPrefix).toBeDefined();
    expect(result.assetPrefix).toEqual(
      `/${microfrontends.config.getApplication('vercel-marketing').getAssetPrefix()}`,
    );
    // 2. rewrites should not exist since it was skipped
    expect(result.rewrites).toBeUndefined();
    // 3. webpack should not exist since it was skipped
    expect(result.webpack).toBeUndefined();
  });

  it('supports user-provided app name', () => {
    process.chdir(
      join(fixtures, 'workspace', 'apps', 'non-microfrontends-dir'),
    );
    const nextConfig = {} as NextConfig;
    expect(() =>
      withMicrofrontends(nextConfig, {
        appName: 'docs-for-test',
      }),
    ).not.toThrow();
  });
});
