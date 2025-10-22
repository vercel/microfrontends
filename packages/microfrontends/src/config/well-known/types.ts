import type { ClientConfig } from '../microfrontends-config/client/types';

/**
 * Data that is returned from the `.well-known/vercel/microfrontends/client-config`
 * endpoint that is used by the client to ensure that navigations and prefetches
 * are routed correctly.
 */
export interface WellKnownClientData {
  config: ClientConfig;
}
