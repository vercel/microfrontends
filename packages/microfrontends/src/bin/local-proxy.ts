import * as http from 'node:http';
import * as https from 'node:https';
import { URL } from 'node:url';
import { parse, serialize } from 'cookie';
import Server from 'http-proxy';
import { pathToRegexp } from 'path-to-regexp';
import cliPkg from '../../package.json';
import { MicrofrontendsServer } from '../config/microfrontends/server';
import { MicrofrontendConfigIsomorphic } from '../config/microfrontends-config/isomorphic';
import type {
  Application,
  ChildApplication,
} from '../config/microfrontends-config/isomorphic/application';
import { MFE_APP_PORT_ENV } from '../config/microfrontends-config/isomorphic/constants';
import { hashApplicationName } from '../config/microfrontends-config/isomorphic/utils/hash-application-name';
import {
  getAppEnvOverrideCookieName,
  parseOverrides,
} from '../config/overrides';
import { localAuthHtml } from './local-auth';
import { logger } from './logger';
import type { LocalProxyApplicationResponse, LocalProxyOptions } from './types';

// This is a header set to `1` by the local proxy on all outgoing requests to locally running applications.
// Applications may optionally route all traffic that they receive without the header to the local proxy.
// This allows the application to appear as if it is serving routes from another microfrontend.
const MFE_LOCAL_PROXY_HEADER = 'x-vercel-mfe-local-proxy-origin';

// This is a query parameter that can be passed to the local proxy to be used as the value of any flags
// for routing groups.
const MFE_FLAG_VALUE = 'vercel-mfe-flag-value';

// A header variant of the flagged routes override query parameter.
// We rely on this being set and passing through any possible middleware to identify if the request
// originally had this value set.
// This is only impactful if the user passed `?vercel-mfe-flag-value=false` and flag is enabled as
// - the request will fall through to default app
// - the request will hit middleware
// - with flag enabled middleware will route the request to the zone
// This flag informs middleware to ignore the flag function and use this value instead.
const MFE_FLAG_VALUE_HEADER = `x-${MFE_FLAG_VALUE}`;

interface ProxyTarget {
  application: string;
  url: URL;
  protocol: 'http' | 'https';
  hostname: string;
  port?: number;
  path?: string;
  isLocal?: boolean;
  originalApplication?: string;
}

export class ProxyRequestRouter {
  config: MicrofrontendConfigIsomorphic;
  localApps: string[];

  constructor(
    config: MicrofrontendConfigIsomorphic,
    {
      localApps,
    }: {
      localApps: string[];
    },
  ) {
    this.config = config;
    this.localApps = localApps;
  }

  getDefaultHost(config: MicrofrontendConfigIsomorphic): ProxyTarget {
    const defaultApp = config.getDefaultApplication();
    return this.getApplicationTarget(defaultApp);
  }

  getApplicationTarget(application: Application): ProxyTarget {
    const useDev = Boolean(
      this.localApps.find(
        (name) => name === application.name || name === application.packageName,
      ),
    );
    let applicationName = application.name;
    let host = useDev ? application.development.local : application.fallback;

    if (application.overrides?.environment?.host) {
      host = application.overrides.environment;
    }

    // Application doesn't have configured host so fallback to default application production
    if (!host) {
      const defaultApp = this.config.getDefaultApplication();
      host = defaultApp.fallback;
      applicationName = defaultApp.name;
    }

    const protocol = host.protocol;
    const hostname = host.host;
    const port = host.port;
    return {
      url: host.toUrl(),
      protocol,
      hostname,
      port,
      application: applicationName,
      isLocal: useDev,
      originalApplication: application.name,
    };
  }

  /**
   * To enable preview deployments in localhost, we need to intercept some auth requests
   * and make sure they proxy to the correct domain. The toolbar will initiate the `vercel-auth-redirect`
   * with a `_host_override` param so that we can properly trigger the redirect flow for the
   * protected host.
   */
  getAuthTarget(
    request: ProxyRequest,
    config: MicrofrontendConfigIsomorphic,
  ): ProxyTarget | undefined {
    const url = new URL(request.url ?? '', `http://${request.headers.host}`);
    const isAuthRedirect = request.url?.startsWith(
      '/.well-known/vercel-auth-redirect',
    );
    const isSsoRedirect = request.url?.startsWith('/sso-api');
    const isJWTRedirect = url.searchParams.has('_vercel_jwt');

    const defaultHost = this.getDefaultHost(config);
    let hostname: string | null = null;
    let path = request.url;

    if (isAuthRedirect) {
      hostname = url.searchParams.get('_host_override');
    }

    if (isSsoRedirect) {
      hostname = 'vercel.com';
    }

    if (isJWTRedirect) {
      hostname = url.searchParams.get('_host_override');
      url.searchParams.delete('_host_override');
      path = `${url.pathname}${url.search}`;
    }

    if (!hostname) {
      return undefined;
    }

    return { ...defaultHost, path, hostname, protocol: 'https', port: 443 };
  }

  getConfigWithOverrides(
    cookies: Record<string, string | undefined>,
  ): MicrofrontendConfigIsomorphic {
    const cookieOverrides = parseOverrides(
      Object.entries(cookies).map(([name, value]) => ({ name, value })),
    );
    const hasOverrides = Object.keys(cookieOverrides.applications).length > 0;
    const serialized = this.config.serialize().config;
    return hasOverrides
      ? new MicrofrontendConfigIsomorphic({
          config: serialized,
          overrides: cookieOverrides,
        })
      : this.config;
  }

  getTarget(request: ProxyRequest): ProxyTarget {
    const cookies = parse(request.headers.cookie || '');
    const config = this.getConfigWithOverrides(cookies);

    if (!request.url) {
      return this.getDefaultHost(config);
    }
    const { path, mfeFlagValue } = extractMfeFlagValue(request.url);

    const authTarget = this.getAuthTarget(request, config);
    if (authTarget) {
      return authTarget;
    }

    const url = new URL(`http://example.com${path}`);

    const target = this.findMatchingApplication({
      path,
      url,
      applications: config.getChildApplications(),
      referer: request.headers.referer,
      // If a request already has the local proxy header, then the request has
      // already gone through the local proxy.
      // This should only happen if middleware indicates that a flagged route
      // is enabled, so we treat this as enabling all flagged routes for this request.
      middlewareMfeZone: request.headers['x-vercel-mfe-zone'],
      // Value to use when encountering any flagged paths instead of checking middleware
      mfeFlagValue,
    });
    if (target) return target;

    const defaultHost = this.getDefaultHost(config);
    logger.debug(
      ` ${path} - Did not match any routes. Routing to default app: ${formatProxyTarget(defaultHost)}`,
    );
    return { path, ...defaultHost };
  }

  findMatchingApplication({
    path,
    url,
    applications,
    referer = undefined,
    middlewareMfeZone = undefined,
    mfeFlagValue = undefined,
  }: {
    path: string;
    url: URL;
    applications: ChildApplication[];
    referer?: string;
    middlewareMfeZone?: string;
    mfeFlagValue?: boolean;
  }): ProxyTarget | null {
    for (const application of Object.values(applications)) {
      const target = this.getApplicationTarget(application);
      if (middlewareMfeZone) {
        if (middlewareMfeZone === application.name) {
          logger.debug(
            ` ${path} - Routing to ${formatProxyTarget(target)} according to 'x-vercel-mfe-zone' header`,
          );
          return { path, ...target };
        }
        continue;
      }
      const builtInRewrite =
        this.checkBuiltinAssetPrefix({
          rewrites: ['/:path*'],
          path,
          url,
          app: application,
        }) ||
        this.checkNextOriginalFrame({ url, referer, applications }) ||
        this.checkNextSourceMap({ url }) ||
        this.checkNextImage({ url, applications });
      if (builtInRewrite) {
        return builtInRewrite;
      }
      for (const group of application.routing) {
        for (const childPath of group.paths) {
          const regexp = pathToRegexp(childPath);
          if (regexp.test(url.pathname)) {
            if (group.flag) {
              if (mfeFlagValue === true) {
                // we fall through and use the path
              } else if (mfeFlagValue === false) {
                // we do not use this group, but instead continue attempting to match this route
                continue;
              } else {
                // No provided value for flags, check middleware
                logger.debug(
                  'Routing group is behind flag. Routing to default app to check flag via middleware.',
                );
                if (!this.isDefaultAppLocal()) {
                  const defaultApp = this.getDefaultHost(this.config);

                  logger.error(
                    `'${path}' is a flagged path, but the default application is not running locally. Using '${defaultApp.hostname}' to handle this request.`,
                  );
                }
                // route request to default app where it should be redirected back if flag enabled
                return null;
              }
            }
            logger.debug(
              ` ${path} - Matched ${childPath}. Routing to ${formatProxyTarget(target)}`,
            );
            return { path, ...target };
          }
        }
      }
    }
    if (middlewareMfeZone) {
      logger.error(
        `A request contained 'x-vercel-mfe-zone: ${middlewareMfeZone}', but no application was found with that name.`,
      );
    }
    return null;
  }

  checkBuiltinAssetPrefix({
    rewrites,
    path,
    url,
    app,
  }: {
    rewrites: string[];
    path: string;
    url: URL;
    app: ChildApplication;
  }): ProxyTarget | null {
    const pathname = url.pathname;
    const target = this.getApplicationTarget(app);
    const assetPrefixes = new Set([
      `vc-ap-${app.name}`,
      `vc-ap-${hashApplicationName(app.name)}`,
      app.getAssetPrefix(),
    ]);
    for (const rewrite of rewrites) {
      for (const assetPrefix of assetPrefixes) {
        if (pathToRegexp(`/${assetPrefix}${rewrite}`).test(pathname)) {
          logger.debug(
            ` ${pathname} - Matched asset prefix. Routing to ${formatProxyTarget(target)}`,
          );
          return {
            path,
            ...target,
          };
        }
      }
    }

    return null;
  }

  checkNextOriginalFrame({
    url,
    referer = undefined,
    applications,
  }: {
    url: URL;
    referer?: string;
    applications: ChildApplication[];
  }): ProxyTarget | null {
    const isStackFrame =
      pathToRegexp('/__nextjs_original-stack-frame').test(url.pathname) ||
      // Plural form was introduced in https://github.com/vercel/next.js/pull/75557
      pathToRegexp('/__nextjs_original-stack-frames').test(url.pathname);
    if (!referer || !isStackFrame) {
      return null;
    }
    const refererURL = new URL(referer);
    const refererPath = `${refererURL.pathname}?${refererURL.search}`;
    // We recurse and see where the referring path would be routed
    const refererApp = this.findMatchingApplication({
      path: refererPath,
      url: refererURL,
      applications,
    });
    if (!refererApp) {
      return null;
    }
    logger.debug(
      ` ${refererURL.pathname} - Routing nextjs stack frame request to ${formatProxyTarget(refererApp)}`,
    );
    return {
      ...refererApp,
      path: `${url.pathname}${url.search}`,
    };
  }

  checkNextSourceMap({ url }: { url: URL }): ProxyTarget | null {
    const isSourceMap = pathToRegexp('/__nextjs_source-map').test(url.pathname);
    if (!isSourceMap) {
      return null;
    }
    // just choose any local application to handle the source map request
    const localApp = this.getArbitraryLocalApp();
    if (!localApp) {
      logger.error(
        ` ${url.pathname} - No locally running application to route request to`,
      );
      return null;
    }
    const target = this.getApplicationTarget(localApp);
    logger.debug(
      ` ${url.pathname} - Routing nextjs source map request to randomly selected local application: ${formatProxyTarget(target)}`,
    );
    return {
      ...target,
      path: `${url.pathname}${url.search}`,
    };
  }

  checkNextImage({
    url,
    applications,
  }: {
    url: URL;
    applications: ChildApplication[];
  }): ProxyTarget | null {
    const isNextImage = pathToRegexp('/_next/image').test(url.pathname);
    if (!isNextImage) {
      return null;
    }

    // Extract the url parameter from the query string
    const imageUrl = url.searchParams.get('url');
    if (!imageUrl) {
      logger.error(
        ` ${url.pathname}?${url.search} - No url parameter found in _next/image request`,
      );
      return null;
    }

    // URL decode the image path
    const decodedPath = decodeURIComponent(imageUrl);
    const imageURL = new URL(`http://example.com${decodedPath}`);

    // Find which application should handle this image path
    const imageApp = this.findMatchingApplication({
      path: decodedPath,
      url: imageURL,
      applications,
    });

    if (!imageApp) {
      return null;
    }

    logger.debug(
      ` ${url.pathname}?${url.search} - Routing nextjs image request to ${formatProxyTarget(imageApp)}`,
    );

    return {
      ...imageApp,
      path: `${url.pathname}${url.search}`,
    };
  }

  isDefaultAppLocal(): boolean {
    const defaultApp = this.config.getDefaultApplication();
    return Boolean(
      this.localApps.find(
        (name) => name === defaultApp.name || name === defaultApp.packageName,
      ),
    );
  }

  getArbitraryLocalApp() {
    for (const application of this.config.getAllApplications()) {
      const name = application.name;
      if (this.localApps.includes(name)) {
        return application;
      }
    }
  }
}

export interface ProxyRequest {
  url?: string;
  headers: {
    'x-vercel-mfe-local-proxy-origin'?: string;
    'x-vercel-mfe-zone'?: string;
    cookie?: string;
    host?: string;
    referer?: string;
  };
}

export class LocalProxy {
  proxy: Server;
  proxyPort: number;
  router: ProxyRequestRouter;
  configFilePath?: string;

  constructor(
    config: MicrofrontendConfigIsomorphic,
    {
      localApps,
      proxyPort,
      configFilePath,
    }: {
      localApps: string[];
      proxyPort?: number;
      configFilePath?: string;
    },
  ) {
    this.router = new ProxyRequestRouter(config, { localApps });
    this.proxyPort = proxyPort ?? this.router.config.getLocalProxyPort();
    this.configFilePath = configFilePath;
    this.proxy = Server.createProxyServer({ secure: true });
    this.proxy.on('error', (err, req, res) => {
      if (res instanceof http.ServerResponse) {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
      }

      const target = this.router.getTarget(req);

      res.end(
        `Error proxying request to ${formatProxyTarget(target)}. Is the server running locally on port ${target.port}?`,
      );

      logger.error(
        `Error proxying request for ${formatProxyTarget(target)}: `,
        err,
      );
    });
  }

  public static fromFile(
    filePath: string | undefined,
    {
      localApps,
      proxyPort,
    }: {
      localApps: LocalProxyOptions['localApps'];
      proxyPort?: number;
    },
  ): LocalProxy {
    let microfrontends: MicrofrontendsServer | undefined;
    if (filePath) {
      microfrontends = MicrofrontendsServer.fromFile({
        filePath,
      });
    } else {
      microfrontends = MicrofrontendsServer.infer();
    }

    LocalProxy.validateLocalApps(localApps, microfrontends.config);
    return new LocalProxy(microfrontends.config, {
      localApps,
      proxyPort,
      configFilePath: filePath,
    });
  }

  private static validateLocalApps(
    localApps: LocalProxyOptions['localApps'],
    config: MicrofrontendConfigIsomorphic,
  ) {
    const unknownApps = [];
    const allApps = new Set();
    for (const app of config.getAllApplications()) {
      allApps.add(app.name);
    }

    for (const app of localApps) {
      if (!allApps.has(app)) {
        unknownApps.push(app);
      }
    }
    if (unknownApps.length) {
      throw new Error(
        `The following apps passed via --local-apps are not in the microfrontends config: ${unknownApps.join(', ')} (microfrontends config contains: ${Array.from(allApps).join(', ')})`,
      );
    }

    // Validate that MFE_APP_PORT is not used with multiple local apps
    if (process.env[MFE_APP_PORT_ENV] && localApps.length > 1) {
      throw new Error(
        `${MFE_APP_PORT_ENV} cannot be used when multiple applications are running locally. ` +
          `You have ${localApps.length} local apps: ${localApps.join(', ')}. ` +
          `Either run a single app locally or remove the ${MFE_APP_PORT_ENV} environment variable.`,
      );
    }
  }

  public startServer(): void {
    const httpServer = http.createServer((req, res) =>
      this.handleRequest(req, res),
    );

    httpServer.on('upgrade', (req, socket, head) => {
      const target = this.router.getTarget(req);
      try {
        const headers: Record<string, string> = {};
        headers[MFE_LOCAL_PROXY_HEADER] = '1';
        this.proxy.ws(req, socket, head, {
          target: target.url,
          headers,
        });
      } catch (err) {
        logger.error('Error proxying ws: ', err);
      }
    });
    // Start the servers
    httpServer.listen(this.proxyPort, () => {
      this.displayStartupMessage();
    });
  }

  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (this.handleProxyInfoRequest(req.url, res)) {
      return;
    }
    if (req.url?.includes('//')) {
      // If the URL contains '//', send a 307 redirect to the normalized URL, preserving all request headers
      const originalUrl = req.url;
      if (originalUrl) {
        const normalizedUrl = originalUrl.replaceAll(/\/[\\/]+/g, '/');
        if (normalizedUrl !== originalUrl) {
          res.writeHead(307, {
            Location: normalizedUrl,
            // Copy incoming request headers except hop-by-hop headers and Location
            ...Object.fromEntries(
              Object.entries(req.headers).filter(
                ([key]) =>
                  ![
                    'connection',
                    'content-length',
                    'transfer-encoding',
                    'location',
                  ].includes(key.toLowerCase()),
              ),
            ),
          });
          res.end();
          return;
        }
      }
    }

    const target = this.router.getTarget(req);
    const { req: strippedReq, mfeFlagValue } = removeMfeFlagQuery(req);
    if (target.protocol === 'https') {
      const { hostname, port, path } = target;
      const app = this.router.config.getApplication(target.application);
      const automationBypass = process.env[app.getAutomationBypassEnvVarName()];

      const cookies = parse(req.headers.cookie || '');
      const overrideCookieName = getAppEnvOverrideCookieName(
        target.application,
      );
      const requestOptions = {
        hostname,
        path,
        method: req.method,
        headers: {
          ...req.headers,
          host: hostname,
          cookie: Object.entries(cookies)
            .reduce<string[]>((acc, [name, value]) => {
              if (
                value &&
                // strip the override cookie if present, as this causes an auth redirect. The
                // override is handled by the local proxy.
                name !== overrideCookieName &&
                // strip the VERCEL_MFE_DEBUG cookie if present, as this causes an auth redirect
                name !== 'VERCEL_MFE_DEBUG'
              ) {
                acc.push(serialize(name, value));
              }
              return acc;
            }, [])
            .join('; '),
          ...(automationBypass
            ? { 'x-vercel-protection-bypass': automationBypass }
            : {}),
        },
        port,
      };

      const localhost = `http://localhost:${this.proxyPort}`;
      const proxyReq = https.request(requestOptions, (realRes) => {
        // This is a vercel deployment protected by deployment protection
        if (
          realRes.statusCode === 401 &&
          realRes.headers['set-cookie']?.find((cookie) =>
            cookie.startsWith('_vercel_sso_nonce='),
          )
        ) {
          const defaultApp = this.router.config.getDefaultApplication();
          return res.end(
            localAuthHtml({
              app: target.application,
              hostname,
              defaultApp: defaultApp.packageName || defaultApp.name,
              automationBypassEnvVarName: app.getAutomationBypassEnvVarName(),
              automationBypass,
              override: cookies[overrideCookieName],
            }),
          );
        }

        // Intercept redirect requests to make sure they resolve back to localhost
        if (
          realRes.statusCode === 307 ||
          realRes.statusCode === 308 ||
          realRes.statusCode === 302 ||
          realRes.statusCode === 301
        ) {
          const locationHeader = realRes.headers.location;
          if (locationHeader) {
            const redirectUrl = new URL(
              locationHeader.replace(/https:\/\/[^/]+\//, '/'),
              localhost,
            );

            realRes.headers.location = redirectUrl.toString();
          }
        }

        res.writeHead(realRes.statusCode || 200, realRes.headers);
        realRes.pipe(res, { end: true });
      });
      req.pipe(proxyReq);
      proxyReq.on('error', (err) => {
        logger.error('Proxy request error: ', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(
          `Error proxying request for ${target.application} to ${hostname}:${port}${path}`,
        );
      });
    } else {
      const headers: Record<string, string> = {};
      headers[MFE_LOCAL_PROXY_HEADER] = '1';
      if (mfeFlagValue !== undefined) {
        headers[MFE_FLAG_VALUE_HEADER] = mfeFlagValue.toString();
      }
      this.proxy.web(strippedReq, res, {
        target: target.url,
        headers,
      });
    }
  }

  // Handles requests that return data from the local proxy itself.
  // Returns true if the request was handled, false otherwise.
  handleProxyInfoRequest(
    path: string | undefined,
    res: http.ServerResponse,
  ): boolean {
    if (!path) {
      return false;
    }
    const url = new URL(`http://example.comf${path}`);
    const pathname = url.pathname;
    switch (pathname) {
      case '/.well-known/vercel/microfrontends/routing': {
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });

        const payload: Record<string, LocalProxyApplicationResponse> =
          Object.fromEntries(
            this.router.config.getAllApplications().map((app) => {
              const { hostname, port, protocol } =
                this.router.getApplicationTarget(app);
              return [
                app.name,
                { routing: { host: hostname, port, protocol } },
              ];
            }),
          );

        res.end(JSON.stringify(payload));
        return true;
      }
    }

    return false;
  }

  private displayStartupMessage(): void {
    const allApps = this.router.config.getAllApplications();
    const localApps: { name: string; port?: number }[] = [];
    const fallbackApps: { name: string; fallback: string }[] = [];
    const defaultApp = this.router.config.getDefaultApplication();
    const defaultFallback = defaultApp.fallback.host;

    for (const app of allApps) {
      const isLocal = this.router.localApps.find(
        (name: string) => name === app.name || name === app.packageName,
      );

      if (isLocal) {
        localApps.push({
          name: app.name,
          port: app.development.local.port,
        });
      } else {
        const target = this.router.getApplicationTarget(app);
        // Use the target hostname, or show the default app fallback if app doesn't have its own fallback
        let fallbackHost = target.hostname;
        if (!app.fallback) {
          fallbackHost = defaultFallback;
        }
        fallbackApps.push({
          name: app.name,
          fallback: fallbackHost,
        });
      }
    }

    logger.info(`\n▲ Microfrontends Proxy (${cliPkg.version}) Started`);

    logger.info(`  - Proxy URL: http://localhost:${this.proxyPort}`);

    if (this.configFilePath) {
      logger.info(`  - Config: ${this.configFilePath}`);
    }

    if (localApps.length > 0) {
      logger.info('  - Local Applications:');
      const displayLocalApps =
        localApps.length > 5
          ? [
              ...localApps.slice(0, 5),
              { name: `... and ${localApps.length - 5} more`, port: undefined },
            ]
          : localApps;
      for (const app of displayLocalApps) {
        if (app.port !== undefined) {
          logger.info(`    • ${app.name} (port ${app.port})`);
        } else {
          logger.info(`    • ${app.name}`);
        }
      }
    }

    if (fallbackApps.length > 0) {
      logger.info('  - Fallback Applications:');
      const displayFallbackApps =
        fallbackApps.length > 5
          ? [
              ...fallbackApps.slice(0, 5),
              { name: `... and ${fallbackApps.length - 5} more`, fallback: '' },
            ]
          : fallbackApps;
      for (const app of displayFallbackApps) {
        if (app.fallback) {
          logger.info(`    • ${app.name} → ${app.fallback}`);
        } else {
          logger.info(`    • ${app.name}`);
        }
      }
    }

    if (localApps.length === 0 && fallbackApps.length === 0) {
      logger.info('  - No applications configured\n');
    }

    if (localApps.length > 0) {
      logger.info(
        '\nRequests directly to the ports of these applications may be automatically\nredirected to this proxy. Set the MFE_DISABLE_LOCAL_PROXY_REWRITE=1\nenvironment variable to disable this behavior.',
      );
    }

    logger.info(
      '\nTo debug routing, set an environment variable MFE_DEBUG=1,\nor enable the debug option when calling withMicrofrontends.\nThis will print out all routing information to the console.\n',
    );

    logger.info(`\n${'─'.repeat(50)}\n`);
  }
}

function extractMfeFlagValue(path: string): {
  path: string;
  mfeFlagValue?: boolean;
} {
  const host = 'http://example.com';
  const url = new URL(`${host}${path}`);
  const mfeFlagValue = stringAsBoolean(url.searchParams.get(MFE_FLAG_VALUE));
  url.searchParams.delete(MFE_FLAG_VALUE);
  const pathWithoutMfe =
    mfeFlagValue === undefined ? path : url.toString().substring(host.length);
  return { path: pathWithoutMfe, mfeFlagValue };
}

function stringAsBoolean(value: string | null): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function removeMfeFlagQuery(req: http.IncomingMessage): {
  req: http.IncomingMessage;
  mfeFlagValue?: boolean;
} {
  if (!req.url) {
    return { req };
  }
  const { path, mfeFlagValue } = extractMfeFlagValue(req.url);
  if (mfeFlagValue === undefined) {
    return { req };
  }
  req.url = path;
  return { req, mfeFlagValue };
}

function formatProxyTarget(target: ProxyTarget): string {
  return `${target.originalApplication} (${target.isLocal ? 'local' : 'fallback'})`;
}
