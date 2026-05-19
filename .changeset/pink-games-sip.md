---
"@vercel/microfrontends": patch
---

Disable prerender speculation rules on Chromium 147 to avoid a [browser crash](https://chromium-review.googlesource.com/c/chromium/src/+/7761927) triggered during cross-zone navigation. Prefetch rules are unaffected. The guard auto-resolves on Chrome 148+, which ships the upstream fix.
