# @vercel/microfrontends

## 2.3.0

### Minor Changes

- 9ba1733: Upgrade path-to-regexp from 6.2.1 to 6.3.0

## 2.2.2

### Patch Changes

- 5a74aaf: Add environment variable overrides for local development ports, enabling multiple worktrees to run simultaneously:

  - `MFE_APP_PORT`: Override the dev server port (e.g., 3331 -> 4000)
  - `MFE_LOCAL_PROXY_PORT`: Override the local proxy port (e.g., 3024 -> 3025)

  **Note:** `MFE_APP_PORT` only works when a single application is running locally. An error will be thrown if multiple local apps are detected with this variable set.

  Usage:

  ```bash
  MFE_APP_PORT=4000 MFE_LOCAL_PROXY_PORT=3025 pnpm dev
  ```

- e343afa: Remove an error from withMicrofrontends when using Next.js 16 with default Turbopack support.

## 2.2.1

### Patch Changes

- d1e7cf7: Improve debug logging when inferring the microfrontends.json configuration when the MFE_DEBUG env var is set.

## 2.2.0

### Minor Changes

- 966b2e9: Two improvements to the local development proxy:

  - Make routing logging less noisy by default. Logging can be added by setting the `MFE_DEBUG` env var or `debug` option. This information is printed in an info message on dev server startup.
  - Always route requests to the local proxy when the local development proxy is running through Turborepo. The logic has been simplified. Users who are running the proxy manually can set the `TURBO_TASK_HAS_MFE_PROXY` env var to `true` when running.

  In addition, we are deprecating two options in `withMicrofrontends` for configuring microfrontends:

  - Deprecate the `configPath` option as `VC_MICROFRONTENDS_CONFIG_FILE_NAME` supersedes it.
  - Deprecate `isProduction`. The application will be treated as non-production if the local turbo proxy is running by detecting the `TURBO_TASK_HAS_MFE_PROXY` env var which Turborepo sets to `true`.

## 2.1.3

### Patch Changes

- 93506f2: Fix Next.js image optimization locally for any image path

## 2.1.2

### Patch Changes

- 0606811: Fix local Next.js Image Optimization

## 2.1.1

### Patch Changes

- 96f0ea5:
  - Add support for locally overriding to MFE aliases: https://vercel.com/changelog/preview-links-between-microfrontends-projects-now-serve-all-paths
  - Fix local Next.js image optimization. Next.js released a security fix which removes headers from being passed on image optimization requests. The microfrontends local proxy previously relied on the headers being passed.

## 2.1.0

### Minor Changes

- c856a5d:
  - Add support for custom `microfrontends.json` file names. This enables a single application to be deployed as multiple different vercel projects / microfrontends.
  - Strip asset prefix from Vercel Firewall rate limit paths. Support Vercel Firewall rate limit requests when they go to a child application.

## 2.0.1

### Patch Changes

- 8c11bdc:
  - Support hyphens and escaped special characters in supported path matching regex https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions
  - Improve error message for when local development proxy can't determine the port
  - Update local proxy double slash routing behaviour to match the production proxy

## 2.0.0

> **Check out our [Public Beta](https://vercel.com/changelog/microfrontends-support-is-now-in-public-beta) changelog to learn more about this release.**

### Major Changes

- This release removes the project name and flag names from being visible to client side code.
  - Modify the auto-generated asset prefix to use a hash of the project name instead of the project name itself.
  - Allow users to specify a custom asset prefix in `microfrontends.json`.
  - Remove project names and flag names from the Microfrontends client configuration.

### Minor Changes

- Use user-provided appName when inferring the location of microfrontends.json.

### Patch Changes

- Improve error messages when the name in `package.json` does not match the Vercel project name.

## 1.5.0

### Minor Changes

- 003d24b: - Automatically add asset prefix to Next.js images using `images.path` in `next.config.js`.
  - Remove deprecated fields `projectId` and `localPort` from the package

## 1.4.1

### Patch Changes

- 10b74ed: Route next/image requests to the correct microfrontends application in the local development proxy.

## 1.4.0

### Minor Changes

- b31a76c: - Improve `PrefetchCrossZoneLinksProvider` performance.
  - Stops components using this context from rerendering every time `prefetchHref` is called on an unseen `href`.
  - Batches multiple prefetch calls together before causing a new render.
  - Improve `MicrofrontendConfigClient` caching.
    - Reuses clients when calling `MicrofrontendConfigClient.fromEnv()` with the same parameters as a previous call. This improves the hit rate of the path cache when there aren't dynamic paths.
    - Caches the `hasDynamicPaths` check so that it doesn't need to be recalculated for each use of the hook.
    - When the promise for the server-fetched config resolves, it stores a cached copy of that directly in a new variable so that future invocations of `useClientConfig()` can have the correct config in their initial render.
    - Adds a `regexpCache` to cache the resulting regex for each path, to avoid calling `pathToRegexp` in most cases beyond the initial few links.
  - Remove the custom `@vercel/microfrontends` `Image` component.
    - The wrapper around Next.js `Image` is no longer needed, as the vercel proxy now handles image optimisation request routing for microfrontends.
    - If you are currently importing `{ Image } from '@vercel/microfrontends/next/client'` you can replace this with `Image from 'next/image'`.
  - Use `defineServer` instead of custom webpack EnvironmentPlugin when the version of Next.js is new enough to support it.
    - [vercel/next.js#79225](https://github.com/vercel/next.js/pull/79225) added support to Next.js for defining server-only compile-time constants independent of the bundler.
      - Like `compiler.define`, this allows users to create compile-time constants both Turbopack and webpack from a single API. `compiler.defineServer` instead only makes these constants available for server or edge environments, not the client environment.
    - The new behaviour is used by default when the version of Next.js is new enough to support it. Otherwise the custom webpack EnvironmentPlugin is used.
    - Optionally, you can specify `preferWebpackEnvironmentPlugin`. This will use the legacy `webpack.EnvironmentPlugin` instead of Next.js's `defineServer` option, even when Next.js is new enough to support it.
  - Remove support for `projectId` in `microfrontends.json`.
    - `projectId` was deprecated in a previous release. This release removes support for the field entirely.
    - If you are still using `projectId`, see the previous release notes in `CHANGELOG.md` for removing it.

## 1.3.0

### Minor Changes

- 8b5f62d: Replace the need to add a `.well-known` endpoint for flagged paths. Instead, just add `/.well-known/vercel/microfrontends/client-config` to your middleware matcher. Note that the middleware is only required if you have flagged paths.

## 1.2.0

### Minor Changes

- 653c9d2: Improved local development proxy, simplified config, Vite support, more detailed error messages, testing, and more!

  This release has some minor breaking changes. We try not do this, but at this stage of the project (where we have a relatively small amount of users, each who we're working closely with), we are leaning more towards breaking things and providing clear upgrade instructions so we can move a little quicker. Please let us know if you have concerns with this approach!

  1. The `fromApp` parameter to your call to `runMicrofrontendsMiddleware` (in your `middleware.ts` file) is gone! Please delete the parameter.

  - Your code will fail to compile until you delete the parameter.

  1. The `development.localPort` field in each application in your `microfrontends.json` file is renamed to `development.local`. All you need to do is delete `Port` from the field name and it will continue working exactly as before!

  - The new field has improved support where you can add a full protocol/host/port if you need (for example, `https://my.localhost.me:8080`), but works the same as before if you just specify a port.

  1. If the application name in your `microfrontends.json` matches the Vercel project name, the `projectId` field is no longer required, please remove it! We would like to deprecate the `projectId` field in the future. If you have any concerns, please reach out.

  - `projectId` is annoying to set up so we hope this simplifies things!
  - The Vercel project name should ideally match the application's `package.json` name. If this is not the case, you will need to set the `packageName` field to the `name` from the `package.json` file. This is needed for the local development proxy to work.
  - Visit https://vercel.com/docs/microfrontends/troubleshooting for test utilities to validate the microfrontends setup for your application.
    If you have any issues with these changes, please reach out! We are here to help.

## 1.1.0

### Minor Changes

- 844006a:
  - Add experimental support for SvelteKit.
  - Add experimental support for Vite and React Router.
  - Improved inference for NX monorepos.
  - Support additional path syntax, `/:path(a|b|c)`, `/:path((?!a|b|c).\*)`, and `/some-:hash.js`
  - Fix the next/server import to avoid potential import issues for peer dependencies.
  - Disallow deprecated fields in microfrontends config by default.
  - Improvements/fixes to local development proxy.
  - Add `supportPagesRouter` option that corrects `/\_next/data` requests to the correct child for Next.js Pages Router.

## 1.0.0

### Major Changes

- 37765c3: Initial public release

### Minor Changes

- b559d60: Add back Vercel specific rewrites in local package for preview and local development without the proxy
- 00ec734: Add back next config rewrites to deployed apps
