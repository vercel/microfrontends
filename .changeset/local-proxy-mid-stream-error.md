---
'@vercel/microfrontends': patch
---

Prevent the local development proxy from crashing on mid-stream upstream errors

The HTTPS fallback path piped the upstream (production) response to the client without attaching an error handler. When that upstream connection reset mid-stream — common when many requests fan out to a production fallback — the unhandled `error` event surfaced as an uncaught exception and crashed the proxy process. The upstream response and client request/response streams now have error handlers that tear down the affected request instead of throwing.
