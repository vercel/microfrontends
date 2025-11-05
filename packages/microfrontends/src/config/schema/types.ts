/**
 * Any exported type from this file has it's own heading in vercel.com/docs/microfrontends/configuration 📚
 * 👉 Be careful when changing exports, ensure the docs support the updated generated schema
 */

/**
 * The microfrontends configuration schema.
 * @see https://vercel.com/docs/microfrontends/configuration
 */
export interface Config {
  /**
   * https://openapi.vercel.sh/microfrontends.json.
   */
  $schema?: string;
  /**
   * The version of the microfrontends config schema.
   */
  version?: '1';
  /**
   * Mapping of Vercel project names to their microfrontend configurations.
   */
  applications: ApplicationRouting;
  /**
   * Optional configuration options for the microfrontend.
   */
  options?: Options;
}

/**
 * Mapping of Vercel project names to their microfrontend configurations.
 */
export type ApplicationRouting = Record<ApplicationId, Application>;

/**
 * The Vercel project name of the microfrontend application.
 *
 * Note: If this name does not also match the name `name` from the `package.json`,
 * set `packageName` with the name used in `package.json`.
 *
 * @see https://vercel.com/docs/microfrontends/configuration#application-naming
 */
export type ApplicationId = string;

/**
 * A list of path groups that are routed to this application.
 */
type Routing = PathGroup[];

/**
 * A group of paths that is routed to this application.
 */
export interface PathGroup {
  /**
   * Group name for the paths.
   */
  group?: string;
  /**
   * The name of the feature flag that controls routing for this group of paths.
   * @see https://vercel.com/docs/microfrontends/path-routing#routing-changes-safely-with-flags
   */
  flag?: string;
  /**
   * A list of path expressions that are routed to this application.
   * @see https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions
   */
  paths: string[];
}

interface Development {
  /**
   * A local port number or host that this application runs on when it is running locally.
   * If passing a string, include the protocol (optional), host (required) and port (optional).
   *
   * Examples of valid values: 8080, my.localhost.me, my.localhost.me:8080, https://my.localhost.me, https://my.localhost.me:8080
   *
   * @defaultValue http://localhost:<port> where port is a stable, unique port number (based on the application name)
   *
   * @see https://vercel.com/docs/microfrontends/local-development
   */
  local?: number | string;
  /**
   * The task to run when starting the development server. Should reference a script in the package.json of the application.
   *
   * @defaultValue "dev"
   *
   * @see https://vercel.com/docs/microfrontends/local-development
   */
  task?: string;
  /**
   * Fallback for local development, could point to any environment. If not provided for child apps,
   * the fallback of the default app will be used.
   *
   * If passing a string, include the protocol (optional), host (required) and port (optional).
   * For example: `https://this.ismyhost:8080`. If omitted, the protocol defaults to HTTPS. If
   * omitted, the port defaults to `80` for HTTP and `443` for HTTPS.
   *
   * @see https://vercel.com/docs/microfrontends/local-development
   */
  fallback?: string;
}

interface DefaultDevelopment extends Development {
  /**
   * Fallback for local development, could point to any environment. This is required for the default
   * app. This value is used as the fallback for child apps as well if they do not have a fallback.
   *
   * If passing a string, include the protocol (optional), host (required) and port (optional).
   * For example: `https://this.ismyhost:8080`. If omitted, the protocol defaults to HTTPS. If
   * omitted, the port defaults to `80` for HTTP and `443` for HTTPS.
   *
   * @see https://vercel.com/docs/microfrontends/local-development
   */
  fallback: string;
}

/**
 * The configuration for a microfrontend application. There must always be one default application.
 */
export type Application = DefaultApplication | ChildApplication;

interface CommonApplication {
  /**
   * The name used to run the application, e.g. the `name` field in the `package.json`.
   *
   * This is used by the local proxy to map the application config to the locally running app.
   *
   * This is only necessary when the application name does not match the `name` used in `package.json`.
   *
   * @see https://vercel.com/docs/microfrontends/configuration#application-naming
   */
  packageName?: string;
}

export interface DefaultApplication extends CommonApplication {
  /**
   * Development configuration for the default application.
   */
  development: DefaultDevelopment;
}

export interface ChildApplication extends CommonApplication {
  /**
   * Development configuration for the child application.
   */
  development?: Development;
  /**
   * Groups of path expressions that are routed to this application.
   *
   * @see https://vercel.com/docs/microfrontends/path-routing
   */
  routing: Routing;

  /**
   * The name of the asset prefix to use instead of the auto-generated name.
   *
   * The asset prefix is used to prefix all paths to static assets, such as JS, CSS, or images
   * that are served by a specific application. It is necessary to ensure there are no conflicts
   * with other applications on the same domain.
   *
   * An auto-generated asset prefix of the form `vc-ap-<hash>` is used when this field is not provided.
   *
   * When this field is provided, `/${assetPrefix}/:path*` must also be added to the
   * list of paths in the `routing` field. Changing the asset prefix after a microfrontend application
   * has already been deployed is not a forwards and backwards compatible change, and the asset prefix
   * should be added to the `routing` field and deployed before setting the `assetPrefix` field.
   *
   * @defaultValue The auto-generated asset prefix of the form `vc-ap-<hash>`
   *
   * @see https://vercel.com/docs/microfrontends/path-routing#asset-prefix
   */
  assetPrefix?: string;
}

export interface Options {
  /**
   * If you want to disable the overrides for the site. For example, if you are managing rewrites
   * between applications externally, you may wish to disable the overrides on the toolbar as
   * they will have no effect.
   *
   * @see https://vercel.com/docs/microfrontends/managing-microfrontends/vercel-toolbar#routing-overrides
   */
  disableOverrides?: boolean;
  /**
   * The port number used by the local proxy server.
   *
   * @defaultValue 3024
   *
   * @see https://vercel.com/docs/microfrontends/local-development
   */
  localProxyPort?: number;
}
