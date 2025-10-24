---
'@vercel/microfrontends': minor
---

- Add support for custom `microfrontends.json` file names. This enables a single application to be deployed as multiple different vercel projects / microfrontends.
- Strip asset prefix from Vercel Firewall rate limit paths. Support Vercel Firewall rate limit requests when they go to a child application.
