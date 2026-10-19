---
'@vercel/microfrontends': patch
---

Reuse the parsed config and compiled path matchers in `runMicrofrontendsMiddleware` across requests instead of rebuilding them on every request
