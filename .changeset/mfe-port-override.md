---
'@vercel/microfrontends': minor
---

Add environment variable overrides for local development ports, enabling multiple worktrees to run simultaneously:

- `MFE_PORT_OVERRIDE`: Override the dev server port (e.g., 3331 -> 4000)
- `MFE_LOCAL_PROXY_PORT_OVERRIDE`: Override the local proxy port (e.g., 3024 -> 3025)

Usage:
```bash
MFE_PORT_OVERRIDE=4000 MFE_LOCAL_PROXY_PORT_OVERRIDE=3025 pnpm dev
```
