import { join } from 'node:path';
import type { Config } from '@sveltejs/kit';
import { fileURLToPath } from '../../test-utils/file-url-to-path';
import { withMicrofrontends } from '.';

const fixtures = fileURLToPath(
  new URL('../../config/__fixtures__', import.meta.url),
);

describe('withMicrofrontends', () => {
  it('does not add appDir for default app', () => {
    const config = {} as Config;
    const result = withMicrofrontends(config, {
      appName: 'vercel-site',
      configPath: join(fixtures, 'simple.jsonc'),
    });
    expect(result.kit?.appDir).toBeUndefined();
  });

  it('adds appDir for child apps', () => {
    const config = {} as Config;
    const result = withMicrofrontends(config, {
      appName: 'vercel-marketing',
      configPath: join(fixtures, 'simple.jsonc'),
    });
    expect(result.kit?.appDir).toEqual('vc-ap-6a379c');
  });

  it('does not throw error if appDir is already defined to auto-generated value', () => {
    const config = {
      kit: {
        appDir: 'vc-ap-6a379c',
      },
    } as Config;
    const result = withMicrofrontends(config, {
      appName: 'vercel-marketing',
      configPath: join(fixtures, 'simple.jsonc'),
    });
    expect(result.kit?.appDir).toEqual('vc-ap-6a379c');
  });

  it('throws error if appDir is already defined if different to auto-generated value', () => {
    const config = {
      kit: {
        appDir: 'mktng',
      },
    } as Config;
    expect(() =>
      withMicrofrontends(config, {
        appName: 'vercel-marketing',
        configPath: join(fixtures, 'simple.jsonc'),
      }),
    ).toThrow();
  });
});
