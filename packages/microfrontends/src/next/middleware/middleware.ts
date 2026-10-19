/// <reference types="@edge-runtime/types" />

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { pathToRegexp } from 'path-to-regexp';
import { localProxyIsRunning } from '../../bin/local-proxy-is-running';
import { logger } from '../../bin/logger';
import { MicrofrontendConfigIsomorphic } from '../../config/microfrontends-config/isomorphic';
import type { ChildApplication } from '../../config/microfrontends-config/isomorphic/application';
import {
  MFE_APP_PORT_ENV,
  MFE_LOCAL_PROXY_PORT_ENV,
} from '../../config/microfrontends-config/isomorphic/constants';
import { isOverrideCookie } from '../../config/overrides';
import { getWellKnownClientData } from '../../config/well-known/endpoints';
import type { WellKnownClientData } from '../../config/well-known/types';
import type {
  MicrofrontendsMiddleware,
  MicrofrontendsMiddlewareHandler,
} from './types';

// Extracts the flag value override if one is present in the headers
function getMfeFlagHeader(req: NextRequest): boolean | null {
  const flagValue = req.headers.get('x-vercel-mfe-flag-value');
  if (flagValue === 'true') {
    return true;
  }
  if (flagValue === 'false') {
    return false;
  }
  return null;
}

interface GetFlagHandlerParams {
  application: ChildApplication;
  flagFn: () => Promise<boolean>;
  flagName: string;
  pattern: RegExp;
  localProxyPort: number;
}

function getFlagHandler({
  application,
  flagFn,
  flagName,
  pattern,
  localProxyPort,
}: GetFlagHandlerParams): MicrofrontendsMiddlewareHandler {
  return async (req: NextRequest): Promise<NextResponse | undefined> => {
    try {
      const pathname = req.nextUrl.pathname;
      const localProxyRunning = localProxyIsRunning();
      // If the pattern doesn't match, we don't need to execute the flag
      const flagValueFromHeader = localProxyRunning
        ? getMfeFlagHeader(req)
        : null;
      if (pattern.test(pathname) && (flagValueFromHeader ?? (await flagFn()))) {
        const headers = new Headers(req.headers);
        /**
         * This header informs the proxy which zone the route the request to.
         * It will override any provided redirect / rewrite host.
         *
         * If a rewrite / redirect includes this header, the proxy will perform the
         * action, but will also replace the host with corresponding host for the zone.
         */
        headers.set('x-vercel-mfe-zone', application.name);
        const middlewareResponseInit = {
          request: {
            headers,
          },
        };
        if (localProxyRunning) {
          logger.debug(
            `Routing flagged path "${pathname}" to local proxy for application "${application.name}"`,
          );
          const url = req.nextUrl;
          url.host = `localhost:${localProxyPort}`;
          return NextResponse.rewrite(url, middlewareResponseInit);
        }
        logger.debug(
          `Routing flagged path "${pathname}" to application "${application.name}"`,
        );
        return NextResponse.next(middlewareResponseInit);
      }
    } catch (e) {
      logger.error(
        `An error occured in the microfrontends middleware evaluating the flag "${flagName}":`,
        e,
      );
      // still want to throw the error, just also making sure the error is logged
      throw e;
    }
  };
  // If the path does not match the pattern, we don't do anything and let the request continue
}

function getWellKnownClientConfigMiddleware(
  config: MicrofrontendConfigIsomorphic,
  flagValues: Record<string, () => Promise<boolean>>,
): MicrofrontendsMiddlewareHandler {
  return async (_: NextRequest): Promise<NextResponse | undefined> => {
    return NextResponse.json<WellKnownClientData>(
      await getWellKnownClientData(config, flagValues),
    );
  };
}

const WELL_KNOWN_CLIENT_CONFIG_PATH =
  '/.well-known/vercel/microfrontends/client-config';

interface FlaggedPath {
  application: ChildApplication;
  flagName: string;
  group: string | undefined;
  pattern: RegExp;
}

interface MicrofrontendsRouting {
  microfrontends: MicrofrontendConfigIsomorphic;
  isDefaultApplication: boolean;
  localProxyPort: number;
  flaggedPaths: FlaggedPath[];
}

// Parsing and validating the config and compiling every routing path is
// expensive for large configs, so this is reused across requests as long as
// everything it is derived from is unchanged. Flag values are applied per
// request, since callers may create a new `flagValues` object per request.
const MAX_CACHED_ROUTING = 100;
const routingCache = new Map<string, MicrofrontendsRouting>();

let lastEnvValues: (string | undefined)[] | undefined;
let lastEnvKey = '';

function getEnvCacheKey(): string {
  const envValues = [
    process.env.MFE_CONFIG,
    process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION,
    process.env[MFE_APP_PORT_ENV],
    process.env[MFE_LOCAL_PROXY_PORT_ENV],
  ];
  // Reuse the same key string while the env is unchanged so that the cache
  // lookup doesn't have to hash the full config string on every request
  if (
    !lastEnvValues ||
    envValues.some((value, i) => value !== lastEnvValues?.[i])
  ) {
    lastEnvValues = envValues;
    lastEnvKey = envValues.join('\0');
  }
  return lastEnvKey;
}

function getRoutingCacheKey(
  cookies: { name: string; value: string }[],
): string {
  let key = getEnvCacheKey();
  for (const cookie of cookies) {
    if (isOverrideCookie(cookie)) {
      key += `\0${cookie.name}=${cookie.value}`;
    }
  }
  return key;
}

function buildMicrofrontendsRouting(
  cookies: { name: string; value: string }[],
): MicrofrontendsRouting {
  const microfrontends = MicrofrontendConfigIsomorphic.fromEnv({ cookies });

  if (!process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION) {
    throw new Error(
      'The NEXT_PUBLIC_MFE_CURRENT_APPLICATION environment variable is not set. Did you run `withMicrofrontends` in your Next.js config?',
    );
  }

  const currentApplication = microfrontends.getApplication(
    process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION,
  );

  const flaggedPaths: FlaggedPath[] = [];
  const isDefaultApplication = currentApplication.isDefault();
  if (isDefaultApplication) {
    for (const application of microfrontends.getChildApplications()) {
      for (const pathGroup of application.routing) {
        const flagName = pathGroup.flag;
        if (flagName) {
          for (const path of pathGroup.paths) {
            flaggedPaths.push({
              application,
              flagName,
              group: pathGroup.group,
              pattern: pathToRegexp(path),
            });
          }
        }
      }
    }
  }

  return {
    microfrontends,
    isDefaultApplication,
    localProxyPort: microfrontends.getLocalProxyPort(),
    flaggedPaths,
  };
}

function getMicrofrontendsRouting(request: NextRequest): MicrofrontendsRouting {
  const cookies = request.cookies.getAll();
  const key = getRoutingCacheKey(cookies);
  const cached = routingCache.get(key);
  if (cached) {
    return cached;
  }

  const routing = buildMicrofrontendsRouting(cookies);
  if (routingCache.size >= MAX_CACHED_ROUTING) {
    routingCache.clear();
  }
  routingCache.set(key, routing);
  return routing;
}

function getFlagFn(
  { application, flagName, group }: FlaggedPath,
  flagValues: Record<string, () => Promise<boolean>>,
): () => Promise<boolean> {
  const flagFn = flagValues[flagName];
  if (!flagFn) {
    throw new Error(
      `Flag "${flagName}" was specified to control routing for path group "${group}" in application ${application.name} but not found in provided flag values. See https://vercel.com/docs/microfrontends/path-routing#add-microfrontends-middleware for more information.`,
    );
  }
  return flagFn;
}

/**
 * Returns an array of middleware functions that will handle routing to the
 * right micro-frontends for the provided configuration.
 *
 * @param config - The micro-frontends configuration object.
 * @param flagValues - An object that maps flag names to functions that return the flag value.
 */
export function getMicrofrontendsMiddleware({
  request,
  flagValues,
}: {
  request: NextRequest;
  flagValues: Record<string, () => Promise<boolean>>;
}): MicrofrontendsMiddleware[] {
  const routing = getMicrofrontendsRouting(request);
  const middlewares: MicrofrontendsMiddleware[] = [];

  if (!routing.isDefaultApplication) {
    return middlewares;
  }

  middlewares.push({
    src: WELL_KNOWN_CLIENT_CONFIG_PATH,
    fn: getWellKnownClientConfigMiddleware(routing.microfrontends, flagValues),
  });

  for (const flaggedPath of routing.flaggedPaths) {
    const flagFn = getFlagFn(flaggedPath, flagValues);
    // Copy the cached pattern so callers can't modify it
    const pattern = new RegExp(flaggedPath.pattern);
    middlewares.push({
      src: pattern,
      fn: getFlagHandler({
        application: flaggedPath.application,
        flagFn,
        flagName: flaggedPath.flagName,
        pattern,
        localProxyPort: routing.localProxyPort,
      }),
    });
  }

  return middlewares;
}

/**
 * Executes the middlewares returned by `getMicrofrontendsMiddleware` and
 * returns a `Response` if any of the micro-frontends middlewares match or
 * `undefined` if none match. If a `Response` object is returned, the calling
 * code should return that Response from the Next.js middleware in order to
 * stop execution of the middleware and perform the rewrite.
 *
 * @see {@link https://vercel.com/docs/microfrontends/path-routing#roll-out-routing-changes-safely-with-flags}
 */
export async function runMicrofrontendsMiddleware({
  request,
  flagValues,
}: {
  request: NextRequest;
  flagValues: Record<string, () => Promise<boolean>>;
}): Promise<Response | undefined> {
  const routing = getMicrofrontendsRouting(request);
  if (!routing.isDefaultApplication) {
    return;
  }

  // Equivalent to running the middlewares from `getMicrofrontendsMiddleware`,
  // without creating handlers for paths that don't match
  for (const flaggedPath of routing.flaggedPaths) {
    getFlagFn(flaggedPath, flagValues);
  }

  const pathname = request.nextUrl.pathname;
  if (pathname === WELL_KNOWN_CLIENT_CONFIG_PATH) {
    const response = await getWellKnownClientConfigMiddleware(
      routing.microfrontends,
      flagValues,
    )(request);
    if (response) {
      return response;
    }
  }

  for (const flaggedPath of routing.flaggedPaths) {
    if (flaggedPath.pattern.test(pathname)) {
      const response = await getFlagHandler({
        application: flaggedPath.application,
        flagFn: getFlagFn(flaggedPath, flagValues),
        flagName: flaggedPath.flagName,
        pattern: flaggedPath.pattern,
        localProxyPort: routing.localProxyPort,
      })(request);
      if (response) {
        return response;
      }
    }
  }
}
