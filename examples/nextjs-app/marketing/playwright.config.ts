import { loadEnvConfig } from '@next/env';
import { playwrightConfig } from 'playwright-config';

loadEnvConfig('./', true);

// eslint-disable-next-line import/no-default-export
export default playwrightConfig;
