---
'@vercel/microfrontends': minor
---


Two improvements to the local development proxy:

- Make routing logging less noisy by default. Logging can be added by setting the `MFE_DEBUG` env var or `debug` option. This information is printed in an info message on dev server startup.
- Always route requests to the local proxy when the local development proxy is running through Turborepo. The logic has been simplified. Users who are running the proxy manually can set the `TURBO_TASK_HAS_MFE_PROXY` env var to `true` when running.

In addition, we are deprecating two options in `withMicrofrontends` for configuring microfrontends:

- Deprecate the `configPath` option as `VC_MICROFRONTENDS_CONFIG_FILE_NAME` supersedes it. 
- Deprecate `isProduction`. The application will be treated as non-production if the local turbo proxy is running by detecting the `TURBO_TASK_HAS_MFE_PROXY` env var which Turborepo sets to `true`.
