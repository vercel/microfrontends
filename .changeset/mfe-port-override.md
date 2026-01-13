---
'@vercel/microfrontends': minor
---

Add environment variable overrides for local development ports, enabling multiple worktrees to run simultaneously:

- `MFE_APP_PORT`: Override the dev server port (e.g., 3331 -> 4000)
- `MFE_LOCAL_PROXY_PORT`: Override the local proxy port (e.g., 3024 -> 3025)

**Note:** `MFE_APP_PORT` only works when a single application is running locally. An error will be thrown if multiple local apps are detected with this variable set.

Usage:
```bash
MFE_APP_PORT=4000 MFE_LOCAL_PROXY_PORT=3025 pnpm dev
```
