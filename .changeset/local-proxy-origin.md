---
"@vercel/microfrontends": minor
---

Add an optional configured origin to the local development proxy via `--origin <origin>` or the `MFE_LOCAL_PROXY_ORIGIN` environment variable (for example `https://web.localhost`). When set, the proxy forwards that origin to your applications as `x-forwarded-proto`/`x-forwarded-host`/`x-forwarded-port` and rewrites fallback redirects onto it, so apps served behind a custom local hostname or a TLS terminator see the URL the browser actually used. When no origin is configured, inbound forwarded headers pass through unchanged.
