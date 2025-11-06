---
'@vercel/microfrontends': minor
---

- Make routing logging less noisy, can opt back in with the `MFE_DEBUG` env var or `debug` option
- Deprecate `configPath` as `VC_MICROFRONTENDS_CONFIG_FILE_NAME` supersedes it
- Always route to local proxy when turbo proxy is running
- Deprecate `isProduction` as it is no longer needed, will only be treated as non-production if the local turbo proxy is running and sets the env var `TURBO_TASK_HAS_MFE_PROXY` to `true`
