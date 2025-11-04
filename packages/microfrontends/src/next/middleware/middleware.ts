/// <reference types="@edge-runtime/types" />

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { pathToRegexp } from 'path-to-regexp';
import type { ChildApplication } from '../../config/microfrontends-config/isomorphic/application';
import { getWellKnownClientData } from '../../config/well-known/endpoints';
import type { WellKnownClientData } from '../../config/well-known/types';
import { localProxyIsRunning } from '../../bin/local-proxy-is-running';
import { MicrofrontendConfigIsomorphic } from '../../config/microfrontends-config/isomorphic';
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
          if (process.env.MFE_DEBUG) {
            // eslint-disable-next-line no-console
            console.log(
              `Routing flagged path "${pathname}" to local proxy for application "${application.name}"`,
            );
          }
          const url = req.nextUrl;
          url.host = `localhost:${localProxyPort}`;
          return NextResponse.rewrite(url, middlewareResponseInit);
        }
        if (process.env.MFE_DEBUG) {
          // eslint-disable-next-line no-console
          console.log(
            `Routing flagged path "${pathname}" to application "${application.name}"`,
          );
        }
        return NextResponse.next(middlewareResponseInit);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
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
  const microfrontends = MicrofrontendConfigIsomorphic.fromEnv({
    cookies: request.cookies.getAll(),
  });
  const middlewares: MicrofrontendsMiddleware[] = [];

  if (!process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION) {
    throw new Error(
      'The NEXT_PUBLIC_MFE_CURRENT_APPLICATION environment variable is not set. Did you run `withMicrofrontends` in your Next.js config?',
    );
  }

  const currentApplication = microfrontends.getApplication(
    process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION,
  );

  if (!currentApplication.isDefault()) {
    return middlewares;
  }

  middlewares.push({
    src: '/.well-known/vercel/microfrontends/client-config',
    fn: getWellKnownClientConfigMiddleware(microfrontends, flagValues),
  });

  const localProxyPort = microfrontends.getLocalProxyPort();

  for (const application of microfrontends.getChildApplications()) {
    for (const pathGroup of application.routing) {
      const flagName = pathGroup.flag;
      if (flagName) {
        const flagFn = flagValues[flagName];
        if (!flagFn) {
          throw new Error(
            `Flag "${flagName}" was specified to control routing for path group "${pathGroup.group}" in application ${application.name} but not found in provided flag values. See https://vercel.com/docs/microfrontends/path-routing#add-microfrontends-middleware for more information.`,
          );
        }
        for (const path of pathGroup.paths) {
          const pattern = pathToRegexp(path);
          middlewares.push({
            src: pattern,
            fn: getFlagHandler({
              application,
              flagFn,
              flagName,
              pattern,
              localProxyPort,
            }),
          });
        }
      }
    }
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
  const pathname = request.nextUrl.pathname;
  const middlewares = getMicrofrontendsMiddleware({
    request,
    flagValues,
  });

  for (const mware of middlewares) {
    if (
      typeof mware.src === 'string'
        ? pathname === mware.src
        : mware.src.test(pathname)
    ) {
      // eslint-disable-next-line no-await-in-loop
      const response = await mware.fn(request);
      if (response) {
        return response;
      }
    }
  }
}
