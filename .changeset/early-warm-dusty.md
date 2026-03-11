---
"@vercel/microfrontends": patch
---

Update local proxy to use `VERCEL_AUTOMATION_BYPASS_SECRET` for bypassing deployment protection on fallback deployments. This is the preferred approach now that multiple automation bypasses are supported. The per-app `AUTOMATION_BYPASS_<NAME>` secret is still supported.
