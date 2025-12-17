import { pathToRegexp } from 'path-to-regexp';
import type { ApplicationRouting, ChildApplication } from '../../schema/types';
import { validateAppPaths, validateConfigPaths } from './validation';

describe('validation', () => {
  describe('validateConfigPaths', () => {
    it.each([
      {
        test: 'simple paths',
        paths: [
          '/',
          '/home',
          '/legal/privacy',
          '/an/end/longer/path',
          '/this/one/99/has/a/number',
        ],
      },
      {
        test: 'wildcard at end',
        paths: [
          '/path/:wildcard+',
          '/:wildcard',
          '/longer/path/with/:wildcard*',
          '/path/with/:slug',
        ],
      },
      {
        test: 'single wildcard anywhere',
        paths: [
          '/:wildcard',
          '/:wildcard/rest',
          '/start/:wildcard/end',
          '/:slug/with/more/at/end',
          '/more/around/:slug/on/both/sides',
          '/moving/to/almost/the/:slug/end',
        ],
      },
      {
        test: 'wildcard middle of path',
        paths: [
          '/some-:wildcard-path',
          '/workbox-:hash.js',
          '/prefix:wildcard',
          '/longer/prefix:wildcard',
          '/longer/prefix:wildcard/in/middle',
        ],
      },
      {
        test: 'Positive matching regexes',
        paths: [
          '/:path(a|b|c)',
          '/:path(a|b|c)/foo',
          '/:path(a|b|c)/:path',
          '/:path(a|b|c)/:path*',
          '/:path(a\\-b|b|c)/:path*',
          '/:path(a\\~b|b|c)/:path*',
          '/:path(a_b|b|c)/:path*',
          '/:path(a\\{b|b|c)/:path*',
          '/foo/:path(a|b|c)',
          '/a/path/:path(en|es|de)',
          '/a/path/:path(en|es|de)/:path',
        ],
      },
      {
        test: 'Negative matching regexes',
        paths: [
          '/:path((?!foo).*)',
          '/app/:path((?!foo).*)',
          '/app/:path((?!foo).*)/bar',
          '/app/:path((?!foo).*)/:path',
          '/app/:path((?!foo|bar).*)',
          '/app/:path((?!foo|bar).*)/:path',
          '/app/:path((?!foo|bar).*)/:path*',
          '/app/:path((?!foo\\-bar|bar).*)/:path*',
          '/app/:path((?!foo_bar|bar).*)/:path*',
          '/app/:path((?!foo\\~bar|bar).*)/:path*',
          '/app/:path((?!foo\\}bar|bar).*)/:path*',
          '/:path((?!a|b|c).*)',
          '/:path((?!a|b|c).*)/foo',
          '/:path((?!a|b|c).*)/:path*',
          '/packages/:path((?!brooklyn|chicago|miami|new-york|san-francisco|ecommerce|usecase|social).*)',
        ],
      },
      {
        test: 'special characters',
        paths: [
          '/\\(hello\\)',
          '/\\$',
          '/\\:',
          '/this/one/has-a-hyphen',
          '/this/one/has-a-colon\\:',
          '/this/one/has-a-dollar$',
          '/this/one/has-a-curly-brace\\{',
          '/\\:regex\\(\\[a-z\\]\\+\\)',
        ],
      },
    ])('should allow $test', ({ paths }) => {
      expect(() =>
        validateConfigPaths({
          default: {
            development: {
              local: 'dev.this.is.unused',
              fallback: 'prod.this.is.unused',
            },
            routing: [{ paths }],
          },
        }),
      ).not.toThrow();
    });

    it.each([
      {
        path: '/:path(a|b|c)',
        matches: ['/a', '/b', '/c'],
        doesntMatch: ['/', '/a/b', '/a/c', '/b/a', '/b/c', '/c/a', '/c/b'],
      },
      {
        path: '/hello\\(world\\)',
        matches: ['/hello(world)'],
      },
      {
        path: '/:path((?!a|b|c).*)',
        matches: ['/', '/d', '/e', '/d/a'],
        doesntMatch: ['/a', '/b', '/c'],
      },
      {
        path: '/:path((?!a-a).*)',
        matches: ['/', '/d', '/e', '/d/a', '/b/a-a'],
        doesntMatch: ['/a-a', '/a-a/b'],
      },
      {
        path: '/:path((?!a\\{a).*)',
        matches: ['/', '/d', '/e', '/d/a', '/b/a-a'],
        doesntMatch: ['/a{a'],
      },
      {
        path: '/:path((?!\\(foo\\)).*)',
        matches: ['/', '/d', '/e', '/d/a', '/b/a-a', '/((foo)'],
        doesntMatch: ['/(foo)'],
      },
      {
        path: '/:path(\\(foo\\)|\\(bar\\))',
        matches: ['/(foo)', '/(bar)'],
        doesntMatch: [
          '/',
          '/d',
          '/e',
          '/d/a',
          '/b/a-a',
          '(foo',
          '/(foo)/a',
          '/(bar)/b',
        ],
      },
    ])('matches $path', ({ path, matches, doesntMatch }) => {
      const regexp = pathToRegexp(path);
      for (const url of matches) {
        expect(regexp.test(url)).toBe(true);
      }
      for (const url of doesntMatch || []) {
        expect(regexp.test(url)).toBe(false);
      }
    });

    it.each([
      {
        path: '/path/:wildcard+/end',
        throws: new Error(
          'Invalid paths: Modifier + is not allowed on wildcard :wildcard in ' +
            '/path/:wildcard+/end. Modifiers are only allowed in the last ' +
            'path component. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/longer/path/with/:wildcard*/in/the/middle',
        throws: new Error(
          'Invalid paths: Modifier * is not allowed on wildcard :wildcard ' +
            'in /longer/path/with/:wildcard*/in/the/middle. Modifiers are only allowed in the last path component. ' +
            'See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/:slug*/at/beginning',
        throws: new Error(
          'Invalid paths: Modifier * is not ' +
            'allowed on wildcard :slug in /:slug*/at/beginning. Modifiers ' +
            'are only allowed in the last path component. ' +
            'See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/:path(!cat|dog)',
        throws: new Error(
          `Invalid paths: Path /:path(!cat|dog) cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
      {
        path: '/a/longer/:regex([a-z]+)/in/middle',
        throws: new Error(
          `Invalid paths: Path /a/longer/:regex([a-z]+)/in/middle cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
      {
        path: '/:regex(a)',
        throws: new Error(
          `Invalid paths: Path /:regex(a) cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
      {
        path: '/{:test/}+',
        throws: new Error(
          'Invalid paths: Optional paths are not supported: /{:test/}+. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/foo/{:test/}+',
        throws: new Error(
          'Invalid paths: Optional paths are not supported: /foo/{:test/}+. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/:path(hello)',
        throws: new Error(
          `Invalid paths: Path /:path(hello) cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
      {
        path: '/(hello)',
        throws: new Error(
          'Invalid paths: Only named wildcards are allowed: /(hello) (hint: add ":path" to the wildcard). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/+',
        throws: new Error(
          'Invalid paths: Path /+ could not be parsed into regexp: Unexpected MODIFIER at 1, expected END. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/:',
        throws: new Error(
          'Invalid paths: Path /: could not be parsed into regexp: Missing parameter name at 1. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/user/:id?',
        throws: new Error(
          'Invalid paths: Optional paths are not supported: /user/:id?. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/user/*',
        throws: new Error(
          'Invalid paths: Path /user/* could not be parsed into regexp: Unexpected MODIFIER at 6, expected END. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/post/:postId(\\d+)',
        throws: new Error(
          `Invalid paths: Path /post/:postId(\\d+) cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
      {
        path: '/user/:id/profile/:tab?',
        throws: new Error(
          'Invalid paths: Optional paths are not supported: /user/:id/profile/:tab?. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/book/:author-:title',
        throws: new Error(
          'Invalid paths: Only one wildcard is allowed per path segment: /book/:author-:title. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/file/:name.:ext',
        throws: new Error(
          'Invalid paths: Only one wildcard is allowed per path segment: /file/:name.:ext. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/city/((?!berlin|amsterdam).*)',
        throws: new Error(
          'Invalid paths: Only named wildcards are allowed: /city/((?!berlin|amsterdam).*) (hint: add ":path" to the wildcard). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/city/:path(berlin/:path)',
        throws: new Error(
          `Invalid paths: Path /city/:path(berlin/:path) cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
      {
        path: '/city/:path((berlin/:path).*)',
        throws: new Error(
          'Invalid paths: Path /city/:path((berlin/:path).*) could not be parsed into regexp: Capturing groups are not allowed at 12. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/city/:path(:path)',
        throws: new Error(
          'Invalid paths: Only one wildcard is allowed per path segment: /city/:path(:path). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.',
        ),
      },
      {
        path: '/city/:path((?!berlin/:path).*)',
        throws: new Error(
          `Invalid paths: Path /city/:path((?!berlin/:path).*) cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
      {
        path: '/city/:path((?!berlin|berlin/:path).*)',
        throws: new Error(
          `Invalid paths: Path /city/:path((?!berlin|berlin/:path).*) cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\('). See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
        ),
      },
    ])('should not allow $path', ({ path, throws }) => {
      expect(() =>
        validateConfigPaths({
          default: {
            development: {
              local: 'dev.this.is.unused',
              fallback: 'prod.this.is.unused',
            },
            routing: [{ paths: [path] }],
          },
        }),
      ).toThrow(throws);
    });

    function createApplicationConfigs(
      path1: string,
      path2: string,
    ): ApplicationRouting {
      return {
        default: {
          development: {
            local: 'dev.this.is.unused',
            fallback: 'prod.this.is.unused',
          },
          routing: [
            {
              paths: [path1],
            },
          ],
        },
        alternate: {
          development: {
            local: 'dev-alt.this.is.unused',
            fallback: 'prod-alt.this.is.unused',
          },
          routing: [
            {
              paths: [path2],
            },
          ],
        },
      };
    }

    it('should fail on overlapping paths', () => {
      expect(() => {
        validateConfigPaths(
          createApplicationConfigs('/foo/:path*', '/foo/bar'),
        );
      }).toThrow(
        'Invalid paths: Overlapping path detected between "/foo/:path*" of ' +
          'applications default and "/foo/bar" of applications alternate',
      );
      expect(() => {
        validateConfigPaths(
          createApplicationConfigs('/foo/bar/baz', '/foo/:path+'),
        );
      }).toThrow(
        'Invalid paths: Overlapping path detected between "/foo/:path+" of ' +
          'applications alternate and "/foo/bar/baz" of applications default',
      );
    });
    it('should pass on disjoint paths', () => {
      expect(() => {
        validateConfigPaths(createApplicationConfigs('/foo/:path*', '/bar'));
      }).not.toThrow();
      expect(() => {
        validateConfigPaths(createApplicationConfigs('/foo', '/foo/:path+'));
      }).not.toThrow();
    });
  });

  describe('validateAppPaths', () => {
    function createChildApplication(
      assetPrefix?: string,
      paths: string[] = ['/app'],
      flag?: string,
    ): ChildApplication {
      return {
        development: {
          local: 'localhost:3000',
          fallback: 'prod.example.com',
        },
        routing: [
          {
            paths,
            ...(flag && { flag }),
          },
        ],
        ...(assetPrefix && { assetPrefix }),
      };
    }

    describe('asset prefix validation', () => {
      it.each([
        'app',
        'my-app',
        'app123',
        'app-123',
        'a',
        'app-with-multiple-hyphens',
        'app123with456numbers',
        'a1',
        'app-123-test',
        'myapp123',
      ])('should allow valid asset prefix: %s', (assetPrefix) => {
        const app = createChildApplication(assetPrefix, [
          '/app',
          `/${assetPrefix}/:path*`,
        ]);
        expect(() => validateAppPaths('test-app', app)).not.toThrow();
      });

      it.each([
        'APP',
        'App',
        'app_underscore',
        'app.dot',
        'app space',
        'app/slash',
        'app\\backslash',
        'app:colon',
        'app;semicolon',
        'app=equals',
        'app+plus',
        'app#hash',
        'app@at',
        'app!exclamation',
        'app$dollar',
        'app%percent',
        'app^caret',
        'app&ampersand',
        'app*asterisk',
        'app(parenthesis',
        'app)parenthesis',
        'app[bracket',
        'app]bracket',
        'app{brace',
        'app}brace',
        'app|pipe',
        'app"quote',
        "app'quote",
        'app`backtick',
        'app<less',
        'app>greater',
        'app?question',
        'app,comma',
        '123',
        '-start-with-hyphen',
        'end-with-hyphen-',
        '--double-hyphen',
        '1app',
        'app-',
        '-',
        '0',
        '9test',
        'test-',
      ])('should not allow invalid asset prefix: %s', (assetPrefix) => {
        const app = createChildApplication(assetPrefix, [
          '/app',
          `/${assetPrefix}/:path*`,
        ]);
        expect(() => validateAppPaths('test-app', app)).toThrow(
          `Invalid asset prefix for application "test-app". ${assetPrefix} must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
        );
      });

      it('should allow empty asset prefix (validation is skipped)', () => {
        const app = createChildApplication('', ['/app']);
        expect(() => validateAppPaths('test-app', app)).not.toThrow();
      });
    });

    describe('asset prefix format constraints', () => {
      it('should require starting with a lowercase letter', () => {
        const invalidStartCases = ['123app', '1app', '9test', '-app', '_app'];
        invalidStartCases.forEach((assetPrefix) => {
          const app = createChildApplication(assetPrefix, [
            '/app',
            `/${assetPrefix}/:path*`,
          ]);
          expect(() => validateAppPaths('test-app', app)).toThrow(
            `Invalid asset prefix for application "test-app". ${assetPrefix} must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
          );
        });
      });

      it('should not allow ending with a hyphen', () => {
        const invalidEndCases = ['app-', 'test-app-', 'my-', 'a-'];
        invalidEndCases.forEach((assetPrefix) => {
          const app = createChildApplication(assetPrefix, [
            '/app',
            `/${assetPrefix}/:path*`,
          ]);
          expect(() => validateAppPaths('test-app', app)).toThrow(
            `Invalid asset prefix for application "test-app". ${assetPrefix} must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
          );
        });
      });

      it('should allow single lowercase letters', () => {
        const validSingleLetters = ['a', 'b', 'z'];
        validSingleLetters.forEach((assetPrefix) => {
          const app = createChildApplication(assetPrefix, [
            '/app',
            `/${assetPrefix}/:path*`,
          ]);
          expect(() => validateAppPaths('test-app', app)).not.toThrow();
        });
      });

      it('should allow proper format with letters, numbers, and hyphens', () => {
        const validCases = [
          'app123',
          'my-app',
          'app-123-test',
          'a1b2c3',
          'frontend-v2',
          'api-service',
        ];
        validCases.forEach((assetPrefix) => {
          const app = createChildApplication(assetPrefix, [
            '/app',
            `/${assetPrefix}/:path*`,
          ]);
          expect(() => validateAppPaths('test-app', app)).not.toThrow();
        });
      });
    });

    describe('asset prefix path requirement', () => {
      it('should require asset prefix path without flag when asset prefix is specified', () => {
        const app = createChildApplication('myapp', ['/app', '/other']);
        expect(() => validateAppPaths('test-app', app)).toThrow(
          'When `assetPrefix` is specified, `/myapp/:path*` must be added the routing paths for the application.',
        );
      });

      it('should pass when asset prefix path is present without flag', () => {
        const app = createChildApplication('myapp', [
          '/app',
          '/myapp/:path*',
          '/other',
        ]);
        expect(() => validateAppPaths('test-app', app)).not.toThrow();
      });

      it('should fail when asset prefix path has a flag', () => {
        const app: ChildApplication = {
          development: {
            local: 'localhost:3000',
            fallback: 'prod.example.com',
          },
          routing: [
            {
              paths: ['/app'],
            },
            {
              paths: ['/myapp/:path*'],
              flag: 'some-flag',
            },
          ],
          assetPrefix: 'myapp',
        };
        expect(() => validateAppPaths('test-app', app)).toThrow(
          'When `assetPrefix` is specified, `/myapp/:path*` must be added the routing paths for the application.',
        );
      });

      it('should pass when asset prefix path exists without flag even if other flagged paths exist', () => {
        const app: ChildApplication = {
          development: {
            local: 'localhost:3000',
            fallback: 'prod.example.com',
          },
          routing: [
            {
              paths: ['/app'],
            },
            {
              paths: ['/myapp/:path*'],
            },
            {
              paths: ['/other/:path*'],
              flag: 'some-flag',
            },
          ],
          assetPrefix: 'myapp',
        };
        expect(() => validateAppPaths('test-app', app)).not.toThrow();
      });

      it('should work without asset prefix specified', () => {
        const app = createChildApplication(undefined, ['/app', '/other']);
        expect(() => validateAppPaths('test-app', app)).not.toThrow();
      });

      it('should require exact asset prefix path match', () => {
        const app = createChildApplication('myapp', [
          '/app',
          '/myapp/something/:path*',
          '/other',
        ]);
        expect(() => validateAppPaths('test-app', app)).toThrow(
          'When `assetPrefix` is specified, `/myapp/:path*` must be added the routing paths for the application.',
        );
      });

      it('should pass when asset prefix is the same as the application name', () => {
        const app = createChildApplication('vc-ap-test-app', [
          '/app',
          '/myapp/:path*',
        ]);
        expect(() => validateAppPaths('test-app', app)).not.toThrow();
      });
    });
  });
});
