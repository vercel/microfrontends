'use client';

import { useEffect, useMemo, useState } from 'react';
import { MicrofrontendConfigClient } from '../microfrontends-config/client';
import type { WellKnownClientData } from '../well-known/types';

const clientCache = new Map<string, MicrofrontendConfigClient>();
const cachedHasDynamicPaths = new Map<string, boolean>();

const getClient = (config: string | undefined) => {
  const existing = clientCache.get(config || '');
  if (existing) {
    return existing;
  }

  const client = MicrofrontendConfigClient.fromEnv(config);
  clientCache.set(config || '', client);
  return client;
};

let cachedServerClientConfigPromise: Promise<MicrofrontendConfigClient | null> | null =
  null;

let cachedServerClient: MicrofrontendConfigClient | null = null;

async function fetchClientConfigFromServer(): Promise<MicrofrontendConfigClient | null> {
  try {
    const response = await fetch(
      '/.well-known/vercel/microfrontends/client-config',
    );
    if (response.status !== 200) {
      return null;
    }
    const responseJson = (await response.json()) as WellKnownClientData;
    const client = new MicrofrontendConfigClient(responseJson.config);
    cachedServerClient = client;
    return client;
  } catch (err) {
    return null;
  }
}

/**
 * Hook to use the client microfrontends configuration. This hook will resolve
 * dynamic paths by fetching the configuration from the server if necessary,
 * allowing the server to specify the values for dynamic paths.
 */
export function useClientConfig(config: string | undefined): {
  clientConfig: MicrofrontendConfigClient;
  isLoading: boolean;
} {
  const [clientConfig, setClientConfig] = useState<MicrofrontendConfigClient>(
    () => cachedServerClient ?? getClient(config),
  );
  const canLoad = useMemo(() => {
    if (
      process.env.NODE_ENV === 'test' &&
      process.env.MFE_FORCE_CLIENT_CONFIG_FROM_SERVER !== '1'
    ) {
      return false;
    }
    // If we've already fetched the server config and it's resolved, we don't need
    // to enter the loading state at all
    if (cachedServerClient) return false;
    // If we've already checked this config for dynamic paths, we can use the
    // cached result from before instead of reevaluating.
    const existing = cachedHasDynamicPaths.get(config || '');
    if (existing !== undefined) return existing;
    // Get the original client config to determine if the config has any
    // dynamic paths.
    const originalClientConfig = getClient(config);
    // As an optimization, only fetch the config from the server if the
    // microfrontends configuration has any dynamic paths. If it doesn't,
    // then the server won't return any different values.
    const hasDynamicPaths = originalClientConfig.hasFlaggedPaths;
    cachedHasDynamicPaths.set(config || '', hasDynamicPaths);
    if (!hasDynamicPaths) {
      return false;
    }
    return true;
  }, [config]);
  const [isLoading, setIsLoading] = useState(canLoad);
  useEffect(() => {
    if (!canLoad) return;
    if (!cachedServerClientConfigPromise) {
      cachedServerClientConfigPromise = fetchClientConfigFromServer();
    }
    void cachedServerClientConfigPromise
      .then((newConfig) => {
        if (newConfig) {
          setClientConfig((prevConfig) => {
            return prevConfig.isEqual(newConfig) ? prevConfig : newConfig;
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [canLoad]);

  return { clientConfig, isLoading };
}

export function resetCachedServerClientConfigPromise(): void {
  cachedServerClientConfigPromise = null;
}
