/*
 * @jest-environment @edge-runtime/jest-environment
 */

import { type NextRequest, NextResponse } from 'next/server';
import { MicrofrontendConfigIsomorphic } from '../../config/microfrontends-config/isomorphic';
import {
  expandWildcards,
  validateMiddlewareConfig,
  validateMiddlewareOnFlaggedPaths,
  validateRouting,
} from '.';

const MICROFRONTEND_CONFIG = new MicrofrontendConfigIsomorphic({
  config: {
    version: '1',
    applications: {
      'root-site': {
        development: { fallback: 'testing.app' },
      },
      'micro-a': {
        routing: [{ paths: ['/a'] }],
      },
      'micro-b': {
        routing: [{ paths: ['/b'] }],
      },
    },
  },
});
const WELL_KNOWN_ENDPOINT = '/.well-known/vercel/microfrontends/client-config';

describe('next testing', () => {
  describe('config validator', () => {
    test('passes for valid config', () => {
      const middlewareConfig = {
        matcher: [WELL_KNOWN_ENDPOINT],
      };
      expect(() => {
        validateMiddlewareConfig(middlewareConfig, MICROFRONTEND_CONFIG);
      }).not.toThrow();
    });

    test('passes for exempted production paths', () => {
      const middlewareConfig = {
        matcher: [WELL_KNOWN_ENDPOINT, '/a', '/b'],
      };
      expect(() => {
        validateMiddlewareConfig(middlewareConfig, MICROFRONTEND_CONFIG, [
          '/a',
          '/b',
        ]);
      }).not.toThrow();
    });

    test('fails for for unused exempted production paths', () => {
      const middlewareConfig = {
        matcher: [WELL_KNOWN_ENDPOINT, '/a'],
      };
      expect(() => {
        validateMiddlewareConfig(middlewareConfig, MICROFRONTEND_CONFIG, [
          '/a',
          '/b',
        ]);
      }).toThrow(
        new Error(
          'Found the following inconsistencies between your microfrontend config and middleware config:\n' +
            '\n' +
            '- The following paths were passed to the extraProductionMatches parameter but were unused. You probably want to remove them from the extraProductionMatches parameter: /b',
        ),
      );
    });

    test('formatting for multiple errors', () => {
      const middlewareConfig = {
        matcher: [WELL_KNOWN_ENDPOINT, '/a', '/b'],
      };
      expect(() => {
        validateMiddlewareConfig(middlewareConfig, MICROFRONTEND_CONFIG);
      }).toThrow(
        new Error(
          'Found the following inconsistencies between your microfrontend config and middleware config:\n' +
            '\n' +
            '- Middleware should not match /a. This path is routed to a microfrontend and will never reach the middleware for the default application.\n' +
            '\n' +
            '- Middleware should not match /b. This path is routed to a microfrontend and will never reach the middleware for the default application.',
        ),
      );
    });

    describe('flagged microfrontend', () => {
      const FLAGGED_MICROFRONTEND_CONFIG = new MicrofrontendConfigIsomorphic({
        config: {
          version: '1',
          applications: {
            'root-site': {
              development: { fallback: 'testing.app' },
            },
            'micro-a': {
              routing: [
                { paths: ['/a'] },
                {
                  paths: ['/flagged/path'],
                  flag: 'a-test-flag',
                },
              ],
            },
          },
        },
      });

      test('correct', () => {
        const middlewareConfig = {
          matcher: [WELL_KNOWN_ENDPOINT, '/flagged/path'],
        };
        expect(() => {
          validateMiddlewareConfig(
            middlewareConfig,
            FLAGGED_MICROFRONTEND_CONFIG,
          );
        }).not.toThrow();
      });

      test('incorrect restriction', () => {
        const middlewareConfig = {
          matcher: [
            WELL_KNOWN_ENDPOINT,
            {
              source: '/flagged/path',
              missing: [
                { type: 'header', key: 'host', value: 'testing.app' } as const,
              ],
            },
          ],
        };
        expect(() => {
          validateMiddlewareConfig(
            middlewareConfig,
            FLAGGED_MICROFRONTEND_CONFIG,
          );
        }).toThrow(
          new Error(
            'Found the following inconsistencies between your microfrontend config and middleware config:\n' +
              '\n' +
              '- Middleware should be configured to match /flagged/path. Middleware config matchers for flagged paths should ALWAYS match.',
          ),
        );
      });

      test('catches missing .well-known path match', () => {
        const middlewareConfig = {
          matcher: ['/flagged/path'],
        };
        expect(() => {
          validateMiddlewareConfig(
            middlewareConfig,
            FLAGGED_MICROFRONTEND_CONFIG,
          );
        }).toThrow(
          new Error(
            'Found the following inconsistencies between your microfrontend config and middleware config:\n' +
              '\n' +
              '- Middleware must be configured to match /.well-known/vercel/microfrontends/client-config. This path is used by the client to know which flagged paths are routed to which microfrontend based on the flag values for the session. See https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher for more information.',
          ),
        );
      });

      test('passes with correct rewrite', async () => {
        await expect(
          validateMiddlewareOnFlaggedPaths(
            FLAGGED_MICROFRONTEND_CONFIG,
            (_uRequest: NextRequest) => {
              return Promise.resolve(
                new NextResponse('OK', {
                  status: 200,
                  headers: {
                    'x-middleware-request-x-vercel-mfe-zone': 'micro-a',
                  },
                }),
              );
            },
          ),
        ).resolves.not.toThrow();
      });

      test('fails with no rewrite', async () => {
        await expect(
          validateMiddlewareOnFlaggedPaths(
            FLAGGED_MICROFRONTEND_CONFIG,
            (_uRequest: NextRequest) => {
              return Promise.resolve(undefined);
            },
          ),
        ).rejects.toEqual(
          new Error(
            'middleware did not action for https://testing.app/flagged/path. Expected to route to micro-a',
          ),
        );
      });

      test('fails with success', async () => {
        await expect(
          validateMiddlewareOnFlaggedPaths(
            FLAGGED_MICROFRONTEND_CONFIG,
            (_uRequest: NextRequest) => {
              return Promise.resolve(new NextResponse('ok', { status: 400 }));
            },
          ),
        ).rejects.toEqual(
          new Error(
            'expected 200 status for https://testing.app/flagged/path but got 400',
          ),
        );
      });

      test('fails with wrong rewrite', async () => {
        await expect(
          validateMiddlewareOnFlaggedPaths(
            FLAGGED_MICROFRONTEND_CONFIG,
            (_uRequest: NextRequest) => {
              return Promise.resolve(
                new NextResponse('OK', {
                  status: 200,
                  headers: {
                    'x-middleware-request-x-vercel-mfe-zone': 'micro-b',
                  },
                }),
              );
            },
          ),
        ).rejects.toEqual(
          new Error(
            'expected https://testing.app/flagged/path to route to micro-a, but got micro-b',
          ),
        );
      });
    });
  });

  describe('expandWildcards', () => {
    test('no wildcards', () => {
      expect(expandWildcards('/')).toEqual(['/']);
      expect(expandWildcards('/my/path')).toEqual(['/my/path']);
    });

    test('only * wildcard', () => {
      expect(expandWildcards('/:path*')).toEqual(['/', '/foo', '/foo/bar']);
      expect(expandWildcards('/:slug*')).toEqual(['/', '/foo', '/foo/bar']);
    });

    test('* wildcard at end', () => {
      expect(expandWildcards('/some/other/:path*')).toEqual([
        '/some/other',
        '/some/other/foo',
        '/some/other/foo/bar',
      ]);
      expect(expandWildcards('/this/is/longer/:slug*')).toEqual([
        '/this/is/longer',
        '/this/is/longer/foo',
        '/this/is/longer/foo/bar',
      ]);
    });

    test('only + wildcard', () => {
      expect(expandWildcards('/:path+')).toEqual(['/foo', '/foo/bar']);
      expect(expandWildcards('/:slug+')).toEqual(['/foo', '/foo/bar']);
    });

    test('+ wildcard at end', () => {
      expect(expandWildcards('/some/other/:path+')).toEqual([
        '/some/other/foo',
        '/some/other/foo/bar',
      ]);
      expect(expandWildcards('/this/is/longer/:slug+')).toEqual([
        '/this/is/longer/foo',
        '/this/is/longer/foo/bar',
      ]);
    });

    test('single wildcard', () => {
      expect(expandWildcards('/:path')).toEqual(['/foo']);
      expect(expandWildcards('/some/path/:slug')).toEqual(['/some/path/foo']);
    });
  });

  describe('validateRouting', () => {
    test('passes with correct config', () => {
      expect(() =>
        validateRouting(MICROFRONTEND_CONFIG, {
          'micro-a': ['/a'],
          'micro-b': ['/b'],
          'root-site': ['/something/else'],
        }),
      ).not.toThrow();
    });

    test('fails with incorrect routing', () => {
      expect(() =>
        validateRouting(MICROFRONTEND_CONFIG, {
          'micro-b': ['/a'],
        }),
      ).toThrow(
        new Error(
          'Incorrect microfrontends routing detected:\n' +
            '\n' +
            '- Expected /a to match micro-b, but it matched micro-a (on /a).',
        ),
      );
    });

    test('fails with incorrect routing to default app', () => {
      expect(() =>
        validateRouting(MICROFRONTEND_CONFIG, {
          'micro-a': ['/c'],
        }),
      ).toThrow(
        new Error(
          'Incorrect microfrontends routing detected:\n' +
            '\n' +
            '- Expected /c to match micro-a, but it matched root-site (on fallback to default application).',
        ),
      );
    });

    test('fails with multiple errors', () => {
      expect(() =>
        validateRouting(MICROFRONTEND_CONFIG, {
          'micro-a': ['/b'],
          'micro-b': ['/a'],
        }),
      ).toThrow(
        new Error(
          'Incorrect microfrontends routing detected:\n' +
            '\n' +
            '- Expected /b to match micro-a, but it matched micro-b (on /b).\n' +
            '- Expected /a to match micro-b, but it matched micro-a (on /a).',
        ),
      );
    });
  });

  test('fails with incorrect application name', () => {
    expect(() =>
      validateRouting(MICROFRONTEND_CONFIG, {
        'micro-c': ['/a'],
      }),
    ).toThrow(
      new Error(
        'Incorrect microfrontends routing detected:\n' +
          '\n' +
          '- Application micro-c does not exist in the microfrontends config. The applications in the config are: root-site, micro-a, micro-b',
      ),
    );
  });

  test('passes with correct flags', () => {
    const config = new MicrofrontendConfigIsomorphic({
      config: {
        version: '1',
        applications: {
          'root-site': {
            development: { fallback: 'testing.app' },
          },
          'micro-flagged': {
            routing: [{ paths: ['/flagged'], flag: 'my-flag' }],
          },
        },
      },
    });
    expect(() =>
      validateRouting(config, {
        'root-site': ['/flagged'],
        'micro-flagged': [{ flag: 'my-flag', path: '/flagged' }],
      }),
    ).not.toThrow();
  });

  test('fails with missing flag', () => {
    const config = new MicrofrontendConfigIsomorphic({
      config: {
        version: '1',
        applications: {
          'root-site': {
            development: { fallback: 'testing.app' },
          },
          'micro-flagged': {
            routing: [{ paths: ['/flagged'], flag: 'my-flag' }],
          },
        },
      },
    });
    expect(() =>
      validateRouting(config, {
        'micro-flagged': ['/flagged'],
      }),
    ).toThrow(
      new Error(
        'Incorrect microfrontends routing detected:\n' +
          '\n' +
          "- Expected /flagged to match micro-flagged, but it matched root-site (on fallback to default application). It would've matched micro-flagged if the my-flag flag was set. If this is what you want, replace /flagged in the paths-to-test list with {path: '/flagged', flag: 'my-flag'}.",
      ),
    );
  });
});
