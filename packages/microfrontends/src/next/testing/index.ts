import { readFileSync } from 'node:fs';
import {
  type NextFetchEvent,
  NextRequest,
  type MiddlewareConfig,
} from 'next/server.js';
import { match, pathToRegexp } from 'path-to-regexp';
import { parse } from 'jsonc-parser';
import { MicrofrontendConfigIsomorphic } from '../../config/microfrontends-config/isomorphic';
import { DefaultApplication } from '../../config/microfrontends-config/isomorphic/application';
import type { Config } from '../../config/schema/types';

/** Replaces path wildcards (if they exist) with synthesized paths. */
export function expandWildcards(path: string): string[] {
  if (path.includes('/:path*') || path.includes('/:slug*')) {
    return [
      path === '/:path*' || path === '/:slug*'
        ? '/'
        : path.replace('/:path*', '').replace('/:slug*', ''),
      path.replace('/:path*', '/foo').replace('/:slug*', '/foo'),
      path.replace('/:path*', '/foo/bar').replace('/:slug*', '/foo/bar'),
    ];
  }
  if (path.includes('/:path+') || path.includes('/:slug+')) {
    return [
      path.replace('/:path+', '/foo').replace('/:slug+', '/foo'),
      path.replace('/:path+', '/foo/bar').replace('/:slug+', '/foo/bar'),
    ];
  }
  if (path.includes('/:path') || path.includes('/:slug')) {
    return [path.replace('/:path', '/foo').replace('/:slug', '/foo')];
  }
  return [path];
}

export function loadMicrofrontendConfigForEdge(
  path: string,
): MicrofrontendConfigIsomorphic {
  // NOTE: It's necessary to read and parse this file manually because tests that
  // run in `@edge-runtime/jest-environment` will fail since the AJV validation
  // from the @vercel/microfrontends package violates the rules by
  // using eval.
  const rawMfConfig = parse(readFileSync(path, 'utf-8')) as Config;
  return new MicrofrontendConfigIsomorphic({
    config: rawMfConfig,
  });
}

export function getAllChildApplicationNames(
  mfConfig: MicrofrontendConfigIsomorphic,
): string[] {
  return mfConfig.getChildApplications().map((app) => app.name);
}

export function getLaunchedPathsForApp(
  mfConfig: MicrofrontendConfigIsomorphic,
  appName: string,
): string[] {
  const app = mfConfig.getApplication(appName);
  if (app instanceof DefaultApplication) {
    return [];
  }

  return [
    `/${app.getAssetPrefix()}/_next/static`,
    ...app.routing
      .filter((group) => !group.flag)
      .flatMap((group) => group.paths.flatMap(expandWildcards)),
  ];
}

export function getFlaggedPathsForApp(
  mfConfig: MicrofrontendConfigIsomorphic,
  appName: string,
): string[] {
  const app = mfConfig.getApplication(appName);
  if (app instanceof DefaultApplication) {
    return [];
  }

  return app.routing
    .filter((group) => Boolean(group.flag))
    .flatMap((group) => group.paths.flatMap(expandWildcards));
}

/**
 * Returns a list of examples for all paths in microfrontends.json.
 */
export function getAllMicrofrontendPaths(
  mfConfig: MicrofrontendConfigIsomorphic,
): string[] {
  return mfConfig.getChildApplications().flatMap((app) => {
    return app.routing.flatMap((group) => group.paths.flatMap(expandWildcards));
  });
}

function urlMatches(
  middlewareConfig: MiddlewareConfig,
  path: string,
  doNotMatchWithHasOrMissing?: boolean,
): boolean {
  if (!middlewareConfig.matcher) {
    return false;
  }
  // This is based off
  // https://github.com/vercel/next.js/blob/4835be182b88f67f282c30db4278c30fe9e5b483/packages/next/src/build/analysis/get-page-static-info.ts#L324
  const matchers = Array.isArray(middlewareConfig.matcher)
    ? middlewareConfig.matcher
    : [middlewareConfig.matcher];
  for (let matcher of matchers) {
    matcher = typeof matcher === 'string' ? { source: matcher } : matcher;
    if (match(matcher.source)(path)) {
      if (doNotMatchWithHasOrMissing && (matcher.has || matcher.missing)) {
        return false;
      }
      return true;
    }
  }
  return false;
}

/**
 * A test to ensure that middleware is configured to work correctly with
 * microfrontends. Passing this test does NOT guarantee middleware is set up
 * correctly, but this should find many common problems. This should only be run
 * on the application marked as "default" in the microfrontend config. If a
 * configuration issue is found, this will throw an exception (this ensures it
 * works with any test framework).
 *
 * For example, if a microfrontend is configured to serve "/my/path" then the
 * default application should not contain any matcher that matches "/my/path".
 *
 * See [documentation](https://vercel.com/docs/microfrontends/troubleshooting#validatemiddlewareconfig) for more information.
 *
 * @example
 * ```ts
 * test('matches microfrontends paths', () => {
 *   expect(() =>
 *     validateMiddlewareConfig(config, './microfrontends.json'),
 *   ).not.toThrow();
 * });
 * ```
 */
export function validateMiddlewareConfig(
  middlewareConfig: MiddlewareConfig,
  microfrontendConfigOrPath: string | MicrofrontendConfigIsomorphic,
  extraProductionMatches?: string[],
): void {
  const microfrontendConfig =
    typeof microfrontendConfigOrPath === 'string'
      ? loadMicrofrontendConfigForEdge(microfrontendConfigOrPath)
      : microfrontendConfigOrPath;

  const errors: string[] = [];
  const usedExtraProductionMatches = new Set<string>();

  const wellKnownEndpoint = '/.well-known/vercel/microfrontends/client-config';
  if (!urlMatches(middlewareConfig, wellKnownEndpoint)) {
    errors.push(
      `Middleware must be configured to match ${wellKnownEndpoint}. This path is used by the client to know which flagged paths are routed to which microfrontend based on the flag values for the session. See https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher for more information.`,
    );
  }

  for (const application of microfrontendConfig.getChildApplications()) {
    const matches = [...application.routing];
    matches.push({
      paths: [`/${application.getAssetPrefix()}/_next/:path+`],
    });

    for (const aMatch of matches) {
      const isFlagged = Boolean(aMatch.flag);

      for (const path of aMatch.paths) {
        const pathsToTest = expandWildcards(path);
        for (const testPath of pathsToTest) {
          const pathForDisplay = `${testPath}${path === testPath ? '' : ` (synthesized from ${path})`}`;

          const productionUrlMatches = urlMatches(middlewareConfig, testPath);
          if (isFlagged) {
            if (!urlMatches(middlewareConfig, testPath, true)) {
              errors.push(
                `Middleware should be configured to match ${pathForDisplay}. Middleware config matchers for flagged paths should ALWAYS match.`,
              );
              // Skip the remaining expanded wildcard paths (if there are any)
              // to only report a single error per wildcard.
              break;
            }
          } else if (productionUrlMatches) {
            if (extraProductionMatches?.includes(path)) {
              usedExtraProductionMatches.add(path);
            } else {
              errors.push(
                `Middleware should not match ${pathForDisplay}. This path is routed to a microfrontend and will never reach the middleware for the default application.`,
              );
            }
            // Skip the remaining expanded wildcard paths (if there are any)
            // to only report a single error per wildcard.
            break;
          }
        }
      }
    }
  }

  const unusedExtraProductionMatches = extraProductionMatches?.filter(
    (x) => !usedExtraProductionMatches.has(x),
  );
  if (unusedExtraProductionMatches?.length) {
    errors.push(
      `The following paths were passed to the extraProductionMatches parameter but were unused. You probably want to remove them from the extraProductionMatches parameter: ${unusedExtraProductionMatches.join(', ')}`,
    );
  }

  if (errors.length > 0) {
    const message = `Found the following inconsistencies between your microfrontend config ${
      typeof microfrontendConfigOrPath === 'string'
        ? `(at ${microfrontendConfigOrPath}) `
        : ''
    }and middleware config:\n\n- `;
    throw new Error(message + errors.join('\n\n- '));
  }
}

/**
 * Ensures that middleware rewrites to the correct path for flagged paths.
 * IMPORTANT: you must enable the necessary flags before calling this function.
 *
 * See [documentation](https://vercel.com/docs/microfrontends/troubleshooting#validatemiddlewareonflaggedpaths) for more information.
 *
 * @example
 * ```ts
 * jest.mock('flags/next', () => ({
 *   flag: jest.fn().mockReturnValue(jest.fn().mockResolvedValue(true)),
 * }));
 *
 * test('matches microfrontends paths', () => {
 *   await expect(
 *     validateMiddlewareOnFlaggedPaths('./microfrontends.json', middleware),
 *   ).resolves.not.toThrow();
 * });
 * ```
 */
export async function validateMiddlewareOnFlaggedPaths(
  microfrontendConfigOrPath: string | MicrofrontendConfigIsomorphic,
  middleware: (
    request: NextRequest,
    event: NextFetchEvent,
  ) => Promise<Response | undefined>,
): Promise<void> {
  const initialEnv = process.env.VERCEL_ENV;
  const initialMfePreviewDomains = process.env.MFE_PREVIEW_DOMAINS;
  try {
    const microfrontendConfig =
      typeof microfrontendConfigOrPath === 'string'
        ? loadMicrofrontendConfigForEdge(microfrontendConfigOrPath)
        : microfrontendConfigOrPath;
    const allAppNames = getAllChildApplicationNames(microfrontendConfig);

    const errors: string[] = [];
    for (const appName of allAppNames) {
      const flaggedPaths = getFlaggedPathsForApp(microfrontendConfig, appName);
      if (flaggedPaths.length) {
        for (const path of flaggedPaths) {
          const host =
            microfrontendConfig.defaultApplication.fallback.toString();
          const requestPath = `${host}${path}`;
          const request = new NextRequest(requestPath);

          const response = await middleware(
            request,
            {} as unknown as NextFetchEvent,
          );
          const routedZone = response?.headers.get(
            'x-middleware-request-x-vercel-mfe-zone',
          );
          if (!response) {
            errors.push(
              `middleware did not action for ${requestPath}. Expected to route to ${appName}`,
            );
          } else if (response.status !== 200) {
            errors.push(
              `expected 200 status for ${requestPath} but got ${response.status}`,
            );
          } else if (routedZone !== appName) {
            errors.push(
              `expected ${requestPath} to route to ${appName}, but got ${routedZone}`,
            );
          }
        }
      }
    }
    if (errors.length) {
      throw new Error(errors.join('\n'));
    }
  } finally {
    process.env.VERCEL_ENV = initialEnv;
    process.env.MFE_PREVIEW_DOMAINS = initialMfePreviewDomains;
  }
}

/**
 * Validates that the given paths route to the correct microfrontend.
 * The `routesToTest` parameter is a record mapping the application name
 * to a list a paths (with an optional flag) that should be routed to that
 * application. If an issue is found, this will throw an exception so that
 * it can be used with any test framework.
 *
 * See [documentation](https://vercel.com/docs/microfrontends/troubleshooting#validaterouting) for more information.
 *
 * For example:
 *
 * ```ts
 * {
 *   'microfrontend-a': ['/a/path', '/a/longer/path'],
 *   'microfrontend-b': ['/b/path'],
 *   'microfrontend-c': [
 *     '/c/path',
 *     {
 *       'path': '/c/flagged',
 *       'flag': 'my-flag',
 *     }
 *   ],
 * }
 * ```
 *
 * This ensures:
 * - `/a/path` and `/a/longer/path` get routed to `microfrontend-a`
 * - `/b/path` gets routed to `microfrontend-b`
 * - `/c/flagged` gets routed to `microfrontend-c` if `my-flag` is enabled.
 */
export function validateRouting(
  microfrontendConfigOrPath: string | MicrofrontendConfigIsomorphic,
  routesToTest: Record<string, (string | { path: string; flag: string })[]>,
) {
  const microfrontendConfig =
    typeof microfrontendConfigOrPath === 'string'
      ? loadMicrofrontendConfigForEdge(microfrontendConfigOrPath)
      : microfrontendConfigOrPath;
  const matches = new Map<{ path: string; flag?: string }, string>();
  for (const application of microfrontendConfig.getChildApplications()) {
    for (const route of application.routing) {
      for (const path of route.paths) {
        matches.set({ path, flag: route.flag }, application.name);
      }
    }
  }
  const errors = [];
  for (const [applicationName, paths] of Object.entries(routesToTest)) {
    if (!microfrontendConfig.hasApplication(applicationName)) {
      errors.push(
        `Application ${applicationName} does not exist in the microfrontends config. The applications in the config are: ${microfrontendConfig
          .getAllApplications()
          .map((app) => app.name)
          .join(', ')}`,
      );
      continue;
    }
    for (const expected of paths) {
      const path = typeof expected === 'string' ? expected : expected.path;
      const flag = typeof expected === 'string' ? undefined : expected.flag;
      const matchedApplications = new Map<string, string[]>();
      const matchesWithoutFlags = new Map<string, string>();

      for (const [matcher, applicationMatched] of matches.entries()) {
        if (pathToRegexp(matcher.path).test(path)) {
          if (!matcher.flag || matcher.flag === flag) {
            const existingMatches =
              matchedApplications.get(applicationMatched) ?? [];
            existingMatches.push(matcher.path);
            matchedApplications.set(applicationMatched, existingMatches);
          } else {
            // This path would've matched this application if this flag was set.
            matchesWithoutFlags.set(applicationName, matcher.flag);
          }
        }
      }
      if (matchedApplications.size === 0) {
        matchedApplications.set(
          microfrontendConfig.getDefaultApplication().name,
          ['fallback to default application'],
        );
      }
      if (matchedApplications.size > 1) {
        const formattedMatches = Array.from(
          matchedApplications
            .entries()
            .map(
              ([matchedApplication, matchers]) =>
                `${matchedApplication} (on ${matchers.join(', ')})`,
            ),
        ).join(', ');
        errors.push(
          `${path} can only match one application, but it matched multiple: ${formattedMatches}`,
        );
      } else if (!matchedApplications.has(applicationName)) {
        const actualMatch = matchedApplications.entries().next().value;
        if (!actualMatch) {
          throw new Error("this shouldn't happen");
        }
        const [matchedApplication, matchers] = actualMatch;
        let extraMessage = '';
        if (matchesWithoutFlags.has(applicationName)) {
          const flagToSet = matchesWithoutFlags.get(applicationName);
          extraMessage = ` It would've matched ${applicationName} if the ${flagToSet} flag was set. If this is what you want, replace ${path} in the paths-to-test list with {path: '${path}', flag: '${flagToSet}'}.`;
        }
        errors.push(
          `Expected ${path}${flag ? ` (with flag ${flag})` : ''} to match ${applicationName}, but it matched ${matchedApplication} (on ${matchers.join(', ')}).${extraMessage}`,
        );
      }
    }
  }
  if (errors.length) {
    throw new Error(
      `Incorrect microfrontends routing detected:\n\n- ${errors.join('\n- ')}`,
    );
  }
}
