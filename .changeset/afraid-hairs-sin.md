---
'@vercel/microfrontends': patch
---

- Add support for locally overriding to MFE aliases: https://vercel.com/changelog/preview-links-between-microfrontends-projects-now-serve-all-paths
- Fix local Next.js image optimization. Next.js released a security fix which removes headers from being passed on image optimization requests. The microfrontends local proxy previously relied on the headers being passed.
