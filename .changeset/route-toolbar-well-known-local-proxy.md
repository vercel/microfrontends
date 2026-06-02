---
"@vercel/microfrontends": patch
---

Route Vercel Toolbar well-known requests through the local proxy to the locally running application that served the page. This supports `@vercel/toolbar@0.2.6+`, which uses `/.well-known/vercel-toolbar/*` for local dev server access.
