/* @jest-environment node */

import fs from 'node:fs';
import { join } from 'node:path';
import { parse } from 'jsonc-parser';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import type { Config } from '../../schema/types';
import { MicrofrontendConfigIsomorphic } from '../isomorphic';
import { hashApplicationName } from '../isomorphic/utils/hash-application-name';

const fixtures = fileURLToPath(new URL('../../__fixtures__', import.meta.url));

describe('class MicrofrontendConfigClient', () => {
  const config = parse(
    fs.readFileSync(join(fixtures, 'simple.jsonc'), 'utf-8'),
  ) as Config;
  const originalConfig = new MicrofrontendConfigIsomorphic({
    config,
  });
  const clientConfig = originalConfig.toClientConfig();
  describe('paths', () => {
    it('returns correct application when exact match', () => {
      expect(clientConfig.getApplicationNameForPath('/home')).toEqual(
        hashApplicationName('vercel-marketing'),
      );
    });

    it('returns correct application when regexp matches', () => {
      expect(
        clientConfig.getApplicationNameForPath('/customers/awesome-mfe-user'),
      ).toEqual(hashApplicationName('vercel-marketing'));
    });

    it('returns default application when no matches', () => {
      expect(clientConfig.getApplicationNameForPath('/dashboard')).toEqual(
        hashApplicationName('vercel-site'),
      );
    });

    it('does not handle non-relative paths', () => {
      expect(() => clientConfig.getApplicationNameForPath('dashboard')).toThrow(
        'Path must start with a /',
      );
    });
  });
});
