import { join } from 'node:path';
import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { transform } from './build-id';

const fixtures = fileURLToPath(
  new URL('../../../config/__fixtures__', import.meta.url),
);

describe('withMicrofrontends: buildId', () => {
  let microfrontends: MicrofrontendsServer;

  beforeAll(() => {
    microfrontends = MicrofrontendsServer.fromFile({
      filePath: join(fixtures, 'simple.jsonc'),
    });
  });

  it('only adds generateBuildId for child applications when supportPagesRouter is true', async () => {
    const childApp = microfrontends.config.getApplication('vercel-marketing');
    const { next } = transform({
      next: {},
      app: childApp,
      microfrontend: microfrontends.config,
      opts: {
        supportPagesRouter: true,
      },
    });
    expect(next.generateBuildId).toBeDefined();
    if (!next.generateBuildId) {
      throw new Error('generateBuildId is not defined');
    }
    const generatedBuildId = await next.generateBuildId();
    expect(generatedBuildId).toMatch(/^vc-ap-6a379c-/);
  });

  it('does not add generateBuildId when supportPagesRouter is false', () => {
    const childApp = microfrontends.config.getApplication('vercel-marketing');
    const { next } = transform({
      next: {},
      app: childApp,
      microfrontend: microfrontends.config,
    });
    expect(next.generateBuildId).toBeUndefined();
  });

  it('does not add generateBuildId for default application', () => {
    const defaultApp = microfrontends.config.getApplication('vercel-site');
    const { next } = transform({
      next: {},
      app: defaultApp,
      microfrontend: microfrontends.config,
      opts: {
        supportPagesRouter: true,
      },
    });
    expect(next.generateBuildId).toBeUndefined();
  });

  it('throws error if generateBuildId is already set', () => {
    const defaultApp = microfrontends.config.getApplication('vercel-site');
    expect(() =>
      transform({
        next: {
          generateBuildId: () => 'test',
        },
        app: defaultApp,
        microfrontend: microfrontends.config,
        opts: {
          supportPagesRouter: true,
        },
      }),
    ).toThrow();
  });

  it('uses custom assetPrefix when specified in application config', async () => {
    const childApp = microfrontends.config.getApplication('vercel-marketing');
    // @ts-expect-error - this is the child application
    childApp.serialized.assetPrefix = 'custom-prefix';

    const { next } = transform({
      next: {},
      app: childApp,
      microfrontend: microfrontends.config,
      opts: {
        supportPagesRouter: true,
      },
    });

    expect(next.generateBuildId).toBeDefined();
    if (!next.generateBuildId) {
      throw new Error('generateBuildId is not defined');
    }
    const generatedBuildId = await next.generateBuildId();
    expect(generatedBuildId).toMatch(/^custom-prefix-/);
  });
});
