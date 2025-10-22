export interface Config {
  $schema?: string;
  version?: '1';
  options?: Options;
  /**
   * Mapping of application names to the routes that they host.
   * Only needs to be defined in the application that owns the primary
   * microfrontend domain
   */
  applications: ApplicationRouting;
}

export type ApplicationRouting = Record<ApplicationId, Application>;

/**
 * The unique identifier for a Microfrontend Application.
 *
 * Must match the Vercel project name.
 *
 * Note: If this name does not also match the name used to run the application, (e.g.
 * the `name` from the `package.json`), then the `packageName` field should be set.
 */
export type ApplicationId = string;

export type Routing = PathGroup[];

export interface PathGroup {
  /**
   * Optional group name for the paths
   */
  group?: string;
  /**
   * flag name that can be used to enable/disable all paths in the group
   */
  flag?: string;
  paths: string[];
}

export interface CommonDevelopment {
  /**
   * A local port number or host string that this application runs on when it is running locally.
   * If passing a string, include the protocol (optional), host (required) and port (optional).
   * For example: `https://this.ismyhost:8080`. If omitted, the protocol defaults to HTTP. If
   * omitted, the port defaults to a unique, but stable (based on the application name) number.
   *
   * Examples of valid values:
   * - 8080
   * - my.localhost.me
   * - my.localhost.me:8080
   * - https://my.localhost.me
   * - https://my.localhost.me:8080
   */
  local?: number | string;
  /**
   * Optional task to run when starting the development server. Should reference a script in the package.json of the application.
   *
   * @defaultValue "dev"
   */
  task?: string;
}

export interface DefaultDevelopment extends CommonDevelopment {
  /**
   * Fallback for local development, could point to any environment. This is required for the default
   * app. This value is used as the fallback for child apps as well if they do not have a fallback.
   *
   * If passing a string, include the protocol (optional), host (required) and port (optional).
   * For example: `https://this.ismyhost:8080`. If omitted, the protocol defaults to HTTPS. If
   * omitted, the port defaults to `80` for HTTP and `443` for HTTPS.
   */
  fallback: string;
}

export interface ChildDevelopment extends CommonDevelopment {
  /**
   * Fallback for local development, could point to any environment. This is optional for child apps.
   * If not provided, the fallback of the default app will be used.
   *
   * If passing a string, include the protocol (optional), host (required) and port (optional).
   * For example: `https://this.ismyhost:8080`. If omitted, the protocol defaults to HTTPS. If
   * omitted, the port defaults to `80` for HTTP and `443` for HTTPS.
   */
  fallback?: string;
}

export type Application = DefaultApplication | ChildApplication;

interface CommonApplication {
  /**
   * The name used to run the application, e.g. the `name` field in the `package.json`.
   *
   * This is used by the local proxy to map the application config to the locally running app.
   *
   * This is only necessary when the application name does not match the `name` used in `package.json`.
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
  development?: ChildDevelopment;
  /**
   * Groups of path expressions that are routed to this application.
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
   */
  assetPrefix?: string;
}

export interface Options {
  /**
   * If you want to disable the overrides for the site. For example, if you are managing rewrites
   * between applications externally, you may wish to disable the overrides on the toolbar as
   * they will have no effect.
   */
  disableOverrides?: boolean;
  /**
   * The port number used by the local proxy server.
   *
   * The default is `3024`.
   */
  localProxyPort?: number;
}
