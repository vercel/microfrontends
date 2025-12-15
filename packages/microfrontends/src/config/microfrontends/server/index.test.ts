import fs from 'node:fs';
import { join } from 'node:path';
import { chdir, cwd } from 'node:process';
import { fileURLToPath } from '../../../test-utils/file-url-to-path';
import { getAppEnvOverrideCookieName } from '../../overrides';
import { Host } from '../../microfrontends-config/isomorphic/host';
import { MicrofrontendsServer } from '.';

const fixtures = fileURLToPath(new URL('../../__fixtures__', import.meta.url));
const fixtureFilePath = (name: string): { filePath: string } => ({
  filePath: join(fixtures, name),
});

describe('class MicrofrontendsServer', () => {
  describe('fromFile', () => {
    it('validates the config file and returns an instance of MicrofrontendsServer', () => {
      const result = MicrofrontendsServer.fromFile(
        fixtureFilePath('simple.jsonc'),
      );

      expect(result.config.getDefaultApplication().name).toBe('vercel-site');
      expect(result.config.getApplication('docs')).toBeDefined();
    });

    it('validates the simplified config file and returns an instance of MicrofrontendsServer', () => {
      const result = MicrofrontendsServer.fromFile(
        fixtureFilePath('simplified-config.json'),
      );

      expect(result.config.getDefaultApplication().name).toBe(
        'nextjs-pages-dashboard',
      );
      expect(result.config.getApplication('nextjs-pages-blog')).toBeDefined();
    });

    it('throws an error if the config file cannot be validated', () => {
      expect(() => {
        MicrofrontendsServer.fromFile(
          fixtureFilePath('invalid/invalid-schema.jsonc'),
        );
      }).toThrow('Invalid microfrontends config');
    });
  });

  describe('fromEnv', () => {
    afterEach(() => {
      // biome-ignore lint/performance/noDelete: Ignored using `--suppress`
      delete process.env.MFE_CONFIG;
    });

    it('validates the config file and returns an instance of MicrofrontendsServer', () => {
      process.env.MFE_CONFIG = fs.readFileSync(
        join(fixtures, 'simple.jsonc'),
        'utf-8',
      );
      const result = MicrofrontendsServer.fromEnv({
        cookies: [],
      });

      expect(result.config.getDefaultApplication().name).toBe('vercel-site');
      expect(result.config.getApplication('docs')).toBeDefined();
    });

    it('throws an error if the config file cannot be validated', () => {
      process.env.MFE_CONFIG = fs.readFileSync(
        join(fixtures, 'invalid/invalid-schema.jsonc'),
        'utf-8',
      );
      expect(() =>
        MicrofrontendsServer.fromEnv({
          cookies: [],
        }),
      ).toThrow('Invalid microfrontends config');
    });

    it('parses and applies overrides when provided', () => {
      process.env.MFE_CONFIG = fs.readFileSync(
        join(fixtures, 'simple.jsonc'),
        'utf-8',
      );
      const result = MicrofrontendsServer.fromEnv({
        cookies: [
          {
            name: getAppEnvOverrideCookieName('vercel-site'),
            value: 'example.com',
          },
          {
            name: getAppEnvOverrideCookieName('vercel-marketing'),
            value: 'example-marketing.com',
          },
        ],
      });

      expect(result.config.overrides).toEqual({
        applications: {
          'vercel-site': { environment: { host: 'example.com' } },
          'vercel-marketing': {
            environment: {
              host: 'example-marketing.com',
            },
          },
        },
      });

      expect(result.config.defaultApplication.overrides).toEqual({
        environment: new Host({ host: 'example.com' }),
      });
      expect(
        result.config.getApplication('vercel-marketing').overrides,
      ).toEqual({
        environment: new Host({ host: 'example-marketing.com' }),
      });
    });

    it('does not apply overrides when overrides are disabled', () => {
      process.env.MFE_CONFIG = fs.readFileSync(
        join(fixtures, 'disabled-overrides.jsonc'),
        'utf-8',
      );
      const result = MicrofrontendsServer.fromEnv({
        cookies: [
          {
            name: getAppEnvOverrideCookieName('vercel-marketing'),
            value: 'example-marketing.com',
          },
        ],
      });
      expect(result.config.overrides).toEqual(undefined);
      expect(
        result.config.getApplication('vercel-marketing').overrides,
      ).toEqual(undefined);
    });
  });

  describe('write', () => {
    afterEach(jest.clearAllMocks);

    it('should use default filename and path if no filePath is provided', () => {
      const result = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      });

      expect(result).toBeInstanceOf(MicrofrontendsServer);

      const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockReturnValue('test');
      const writeFileSpy = jest
        .spyOn(fs, 'writeFileSync')
        .mockReturnValue(undefined);

      result.writeConfig();

      expect(mkdirSpy).toHaveBeenCalledWith('microfrontends', {
        recursive: true,
      });
      expect(writeFileSpy).toHaveBeenCalledWith(
        join('microfrontends', 'microfrontends.json'),
        JSON.stringify(result.config.toSchemaJson(), null, 2),
      );
    });

    it('should write without formatting when option is used', () => {
      const result = MicrofrontendsServer.fromFile({
        filePath: join(fixtures, 'simple.jsonc'),
      });

      expect(result).toBeInstanceOf(MicrofrontendsServer);

      const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockReturnValue('test');
      const writeFileSpy = jest
        .spyOn(fs, 'writeFileSync')
        .mockReturnValue(undefined);

      result.writeConfig({
        pretty: false,
      });

      expect(mkdirSpy).toHaveBeenCalledWith('microfrontends', {
        recursive: true,
      });
      expect(writeFileSpy).toHaveBeenCalledWith(
        join('microfrontends', 'microfrontends.json'),
        JSON.stringify(result.config.toSchemaJson()),
      );
    });
  });

  describe('infer', () => {
    let realCwd: string;

    beforeEach(() => {
      realCwd = cwd();
    });

    it('find microfrontends.json in simple monorepo', () => {
      chdir(join(fixtures, 'workspace', 'apps', 'docs-for-test'));
      const config = MicrofrontendsServer.infer({
        directory: join(fixtures, 'workspace', 'apps', 'docs-for-test'),
      }).config;
      expect(config.getAllApplications()).toHaveLength(2);
      expect(config.getApplication('web')).toBeDefined();
      expect(config.getApplication('docs-for-test')).toBeDefined();
    });

    it('handles invalid microfrontends.json errors correctly in inference', () => {
      chdir(join(fixtures, 'invalid-workspace', 'apps', 'docs-for-test'));
      expect(() =>
        MicrofrontendsServer.infer({
          directory: join(
            fixtures,
            'invalid-workspace',
            'apps',
            'docs-for-test',
          ),
        }),
      ).toThrow(`Invalid microfrontends config:
 - Property 'development' is required in field applications/web
 - Unable to infer if applications/web is the default app or a child app. This usually means that there is another error in the configuration.

See https://openapi.vercel.sh/microfrontends.json for the schema.`);
    });

    it('find microfrontends.json in NX workspace', () => {
      chdir(join(fixtures, 'nx-workspace'));
      process.env.NX_TASK_TARGET_PROJECT = 'marketing-for-test';
      process.env.NX_WORKSPACE_ROOT = join(fixtures, 'nx-workspace');
      const config = MicrofrontendsServer.infer().config;
      expect(config.getAllApplications()).toHaveLength(2);
      expect(config.getApplication('web')).toBeDefined();
      expect(config.getApplication('marketing-for-test')).toBeDefined();
    });

    it('find microfrontends.json from env', () => {
      const env = join(
        fixtures,
        'vc',
        'microfrontends',
        'pull',
        '.vercel',
        'microfrontends.json',
      );
      process.env.VC_MICROFRONTENDS_CONFIG = env;
      const config = MicrofrontendsServer.infer().config;
      delete process.env.VC_MICROFRONTENDS_CONFIG;
      expect(config.getAllApplications()).toHaveLength(4);
      expect(config.getApplication('web')).toBeDefined();
      expect(config.getApplication('docs-for-test')).toBeDefined();
      expect(config.getApplication('vercel-microfrontends-pull')).toBeDefined();
      expect(config.getApplication('app-with-packagename')).toBeDefined();
      expect(
        config.getApplication('app-with-packagename-another'),
      ).toBeDefined();
    });

    it('infers microfrontends.json when VERCEL_PROJECT_NAME is set', () => {
      process.env.VERCEL_PROJECT_NAME = 'docs';
      chdir(join(fixtures, 'package-name-differs', 'apps', 'docs'));
      const config = MicrofrontendsServer.infer().config;
      expect(config.getAllApplications()).toHaveLength(2);
      expect(() => config.getApplication('web')).toBeDefined();
      expect(() => config.getApplication('docs')).toBeDefined();
    });

    it('throws informative error message when inference fails because package.json name is different from project name', () => {
      chdir(join(fixtures, 'package-name-differs', 'apps', 'docs'));
      expect(() => MicrofrontendsServer.infer()).toThrow(
        'If the name in package.json (docs-with-different-package-name) differs from your Vercel Project name, set the `packageName` field',
      );
    });

    it('throws informative error message when inference fails because microfrontends.json does not have projectName', () => {
      process.env.VERCEL_PROJECT_NAME = 'docs';
      chdir(join(fixtures, 'workspace', 'apps', 'docs-for-test'));
      expect(() => MicrofrontendsServer.infer()).toThrow(
        'Names of applications in `microfrontends.json` must match the Vercel Project name (docs).',
      );
    });

    it('mentions packageName when application can not be found', () => {
      const env = join(
        fixtures,
        'vc',
        'microfrontends',
        'pull',
        '.vercel',
        'microfrontends.json',
      );
      process.env.VC_MICROFRONTENDS_CONFIG = env;
      const config = MicrofrontendsServer.infer().config;
      delete process.env.VC_MICROFRONTENDS_CONFIG;
      expect(config.getAllApplications()).toHaveLength(4);
      expect(() =>
        config.getApplication('package-json-name-does-not-match-project-name'),
      ).toThrow(
        'set the `packageName` field for the application in `microfrontends.json`',
      );
    });

    it('find microfrontends.json in .vercel directory', () => {
      chdir(join(fixtures, 'vc', 'microfrontends', 'pull'));
      const config = MicrofrontendsServer.infer({
        directory: join(fixtures, 'vc', 'microfrontends', 'pull'),
      }).config;
      expect(config.getAllApplications()).toHaveLength(4);
      expect(config.getApplication('web')).toBeDefined();
      expect(config.getApplication('docs-for-test')).toBeDefined();
      expect(config.getApplication('vercel-microfrontends-pull')).toBeDefined();
      expect(config.getApplication('app-with-packagename')).toBeDefined();
      expect(
        config.getApplication('app-with-packagename-another'),
      ).toBeDefined();
    });

    afterEach(() => {
      chdir(realCwd);
      // biome-ignore lint/performance/noDelete: Cleaning up test
      delete process.env.NX_TASK_TARGET_PROJECT;
      // biome-ignore lint/performance/noDelete: Cleaning up test
      delete process.env.NX_WORKSPACE_ROOT;
      // biome-ignore lint/performance/noDelete: Cleaning up test
      delete process.env.VERCEL_PROJECT_NAME;
    });

    it('throws helpful error when config is misplaced at repo root .vercel', () => {
      chdir(join(fixtures, 'misplaced-vc-config-workspace', 'apps', 'web'));

      expect(() =>
        MicrofrontendsServer.infer({
          directory: join(
            fixtures,
            'misplaced-vc-config-workspace',
            'apps',
            'web',
          ),
        }),
      ).toThrow(
        'A microfrontends config was found in the .vercel directory at the repository root',
      );
    });
  });
});
