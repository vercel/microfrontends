import { join } from 'node:path';
import { chdir, cwd } from 'node:process';
import { fileURLToPath } from '../test-utils/file-url-to-path';
import { MFE_PORT_OVERRIDE_ENV, mfePort } from './mfe-port';

// Use the existing fixtures
const fixtures = fileURLToPath(
  new URL('../config/__fixtures__', import.meta.url),
);

describe('mfePort', () => {
  const originalCwd = cwd();
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env before each test
    delete process.env[MFE_PORT_OVERRIDE_ENV];
  });

  afterEach(() => {
    chdir(originalCwd);
    process.env = { ...originalEnv };
  });

  describe('with MFE_PORT_OVERRIDE environment variable', () => {
    it('uses the override port when set to a valid number', () => {
      // Create a minimal fixture directory for this test
      const packageDir = join(fixtures, 'with-package-json');
      process.env[MFE_PORT_OVERRIDE_ENV] = '4000';

      const result = mfePort(packageDir);

      expect(result.port).toBe(4000);
      expect(result.overridden).toBe(true);
    });

    it('uses the override port when set to a string number', () => {
      const packageDir = join(fixtures, 'with-package-json');
      process.env[MFE_PORT_OVERRIDE_ENV] = '8080';

      const result = mfePort(packageDir);

      expect(result.port).toBe(8080);
      expect(result.overridden).toBe(true);
    });

    it('ignores invalid override values (non-numeric)', () => {
      const packageDir = join(fixtures, 'with-package-json');
      process.env[MFE_PORT_OVERRIDE_ENV] = 'not-a-number';

      // Should fall through to config loading, which will fail without proper setup
      // This test validates that invalid values don't cause the override to trigger
      expect(() => mfePort(packageDir)).toThrow();
    });

    it('ignores override values out of valid port range (too low)', () => {
      const packageDir = join(fixtures, 'with-package-json');
      process.env[MFE_PORT_OVERRIDE_ENV] = '0';

      expect(() => mfePort(packageDir)).toThrow();
    });

    it('ignores override values out of valid port range (too high)', () => {
      const packageDir = join(fixtures, 'with-package-json');
      process.env[MFE_PORT_OVERRIDE_ENV] = '70000';

      expect(() => mfePort(packageDir)).toThrow();
    });

    it('ignores negative port values', () => {
      const packageDir = join(fixtures, 'with-package-json');
      process.env[MFE_PORT_OVERRIDE_ENV] = '-1';

      expect(() => mfePort(packageDir)).toThrow();
    });
  });
});
