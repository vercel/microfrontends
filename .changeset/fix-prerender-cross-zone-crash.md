---
"@vercel/microfrontends": minor
---

`<PrefetchCrossZoneLinks />`: add `prerender?: boolean` prop (default `true`). When `false`, only `prefetch:` rules are emitted and the `prerender:` block is omitted entirely; cross-zone prefetch behavior is unchanged.

Escape hatch for consumers hit by Chromium prerender-activation crashes on cross-deployment same-origin navigations (Chrome 147+). Default behavior is unchanged.
