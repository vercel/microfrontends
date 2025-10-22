import { validateSchema } from './validation';

describe('validateSchema', () => {
  describe('valid configs do not throw errors', () => {
    it('only default app', () => {
      const config = {
        applications: {
          app1: {
            development: {
              local: 'localhost:3000',
              fallback: 'prod.com',
            },
          },
        },
      };
      expect(validateSchema(JSON.stringify(config))).toEqual(config);
    });

    it('full config', () => {
      const config = {
        $schema: 'https://openapi.vercel.sh/microfrontends.json',
        applications: {
          'nextjs-app-marketing': {
            development: {
              local: 3000,
              fallback: 'nextjs-app-marketing.vercel.app',
            },
          },
          'nextjs-app-docs': {
            development: {
              local: 3001,
            },
            routing: [
              {
                group: 'docs',
                paths: ['/docs', '/docs/:path*'],
              },
              {
                group: 'flagged-docs-paths',
                flag: 'flagged-docs-enabled',
                paths: ['/flagged/docs'],
              },
              {
                group: 'mid-path-wildcard',
                paths: ['/some-:hash.js'],
              },
              {
                group: 'excluding regex',
                paths: ['/city/:path((?!berlin|amsterdam).*)'],
              },
            ],
          },
        },
        options: {
          disableOverrides: true,
          localProxyPort: 3025,
        },
      };
      expect(validateSchema(JSON.stringify(config))).toEqual(config);
    });
  });

  describe('invalid configs throw errors', () => {
    it('additional root field', () => {
      const config = {
        applications: {
          app1: {
            development: {
              local: 'localhost:3000',
            },
          },
        },
        unnecessaryField: 'test',
      };
      expect(() =>
        validateSchema(JSON.stringify(config)),
      ).toThrowErrorMatchingSnapshot();
    });

    it('missing applications', () => {
      const config = {
        version: '1',
      };
      expect(() =>
        validateSchema(JSON.stringify(config)),
      ).toThrowErrorMatchingSnapshot();
    });

    it('invalid routing', () => {
      const config = {
        applications: {
          app1: {
            development: {
              local: 'localhost:3000',
            },
            routing: [
              {
                paths: ['/*'],
                flagg: 'invalid-flag',
              },
            ],
          },
        },
      };
      expect(() =>
        validateSchema(JSON.stringify(config)),
      ).toThrowErrorMatchingSnapshot();
    });

    it('invalid local field', () => {
      const config = {
        applications: {
          app1: {
            development: {
              local: false,
            },
          },
        },
      };
      expect(() =>
        validateSchema(JSON.stringify(config)),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});
