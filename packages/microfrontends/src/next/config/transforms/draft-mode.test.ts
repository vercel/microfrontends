import { join } from 'node:path';
import type { NextConfig } from 'next';
import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { transform } from './draft-mode';

const fixtures = fileURLToPath(
  new URL('../../../config/__fixtures__', import.meta.url),
);
const microfrontends = MicrofrontendsServer.fromFile({
  filePath: join(fixtures, 'simple.jsonc'),
});
const currentZone = microfrontends.config.getDefaultApplication();

describe('withMicrofrontends: experimental.multiZoneDraftMode', () => {
  it('sets experimental.multiZoneDraftMode when not present', () => {
    const nextConfig: NextConfig = {};
    const { next: newConfig } = transform({
      next: nextConfig,
      app: currentZone,
      microfrontend: microfrontends.config,
    });
    expect(newConfig.experimental?.multiZoneDraftMode).toEqual(true);
  });

  it('does not override experimental.multiZoneDraftMode when present', () => {
    const nextConfig: NextConfig = {
      experimental: {
        multiZoneDraftMode: false,
      },
    };
    const { next: newConfig } = transform({
      next: nextConfig,
      app: currentZone,
      microfrontend: microfrontends.config,
    });
    expect(newConfig.experimental?.multiZoneDraftMode).toEqual(false);
  });

  it('does not modify other experimental properties', () => {
    const nextConfig: NextConfig = {
      experimental: {
        scrollRestoration: true,
      },
    };
    const { next: newConfig } = transform({
      next: nextConfig,
      app: currentZone,
      microfrontend: microfrontends.config,
    });
    expect(newConfig.experimental?.multiZoneDraftMode).toEqual(true);
    expect(newConfig.experimental?.scrollRestoration).toEqual(true);
  });
});
