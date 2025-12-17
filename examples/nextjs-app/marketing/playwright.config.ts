import { loadEnvConfig } from '@next/env';
import { playwrightConfig } from 'playwright-config';

loadEnvConfig('./', true);

export default playwrightConfig;
