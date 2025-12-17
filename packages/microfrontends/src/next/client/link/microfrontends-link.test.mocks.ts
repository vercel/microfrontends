import { MicrofrontendsServer } from '../../../config/microfrontends/server';
import { hashApplicationName } from '../../../config/microfrontends-config/isomorphic/utils/hash-application-name';
import { TEST_CONFIG } from '../../../test-utils/fixtures/test-config';

process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION = 'dashboard';
process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH =
  hashApplicationName('dashboard');
process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG = JSON.stringify(
  MicrofrontendsServer.fromUnknown({
    config: TEST_CONFIG,
  }).config.toClientConfig({ removeFlaggedPaths: true }),
);
