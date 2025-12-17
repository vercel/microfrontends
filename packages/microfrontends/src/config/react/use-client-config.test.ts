import fs from 'node:fs';
import { join } from 'node:path';
import { renderHook, waitFor } from '@testing-library/react';
import { parse } from 'jsonc-parser';
import { fileURLToPath } from '../../test-utils/file-url-to-path';
import type { ClientConfig } from '../microfrontends-config/client/types';
import { MicrofrontendConfigIsomorphic } from '../microfrontends-config/isomorphic';
import type { Config } from '../schema/types';
import {
  resetCachedServerClientConfigPromise,
  useClientConfig,
} from './use-client-config';

const fixtures = fileURLToPath(new URL('../__fixtures__', import.meta.url));

const oldFetch = global.fetch;

describe('useClientConfig', () => {
  const mockFetch: jest.Mock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = mockFetch;
    process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG = undefined;
    process.env.MFE_FORCE_CLIENT_CONFIG_FROM_SERVER = '1';
    resetCachedServerClientConfigPromise();
  });

  afterEach(() => {
    global.fetch = oldFetch;
  });

  function mockServerResponse(config: ClientConfig): void {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () =>
        Promise.resolve({
          config,
        }),
    });
  }

  it('skips server call when there are no dynamic paths', () => {
    const config = parse(
      fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
    ) as Config;
    delete config.applications['other-app'];
    const originalConfig = new MicrofrontendConfigIsomorphic({
      config,
    });
    process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG = JSON.stringify(
      originalConfig.toClientConfig({ removeFlaggedPaths: true }).serialize(),
    );

    const { result } = renderHook(() =>
      useClientConfig(process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG),
    );
    const { clientConfig, isLoading } = result.current;
    expect(
      clientConfig.isEqual(
        originalConfig.toClientConfig({ removeFlaggedPaths: true }),
      ),
    ).toEqual(true);
    expect(isLoading).toEqual(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('server error returns original config', async () => {
    const config = parse(
      fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
    ) as Config;
    const originalConfig = new MicrofrontendConfigIsomorphic({
      config,
    });
    process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG = JSON.stringify(
      originalConfig.toClientConfig({ removeFlaggedPaths: true }).serialize(),
    );
    mockFetch.mockImplementation(() => {
      throw new Error('Server error');
    });
    const { result } = renderHook(() =>
      useClientConfig(process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG),
    );
    await waitFor(() => {
      expect(result.current.isLoading).toEqual(false);
    });
    const { clientConfig } = result.current;
    expect(
      clientConfig.isEqual(
        originalConfig.toClientConfig({ removeFlaggedPaths: true }),
      ),
    ).toEqual(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('uses server results when there are dynamic paths', async () => {
    const config = parse(
      fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
    ) as Config;
    const originalConfig = new MicrofrontendConfigIsomorphic({
      config,
    });
    process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG = JSON.stringify(
      originalConfig.toClientConfig({ removeFlaggedPaths: true }).serialize(),
    );
    mockServerResponse(originalConfig.toClientConfig());
    const { result } = renderHook(() =>
      useClientConfig(process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG),
    );
    expect(result.current.isLoading).toEqual(true);
    await waitFor(() => {
      expect(result.current.isLoading).toEqual(false);
    });
    const { clientConfig } = result.current;
    expect(clientConfig.isEqual(originalConfig.toClientConfig())).toEqual(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
