---
name: vercel-microfrontends
description: Guide for building, configuring, and deploying microfrontends on Vercel. Use this skill when the user mentions microfrontends, multi-zones, splitting an app across teams, independent deployments, cross-app routing, incremental migration, composing multiple frontends under one domain, microfrontends.json, @vercel/microfrontends, the microfrontends local proxy, or path-based routing between Vercel projects. Also use when the user asks about shared layouts across projects, navigation between microfrontends, fallback environments, asset prefixes, or feature flag controlled routing.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel Microfrontends

Microfrontends let you split a large application into smaller, independently deployable units that render as one cohesive app. Each microfrontend can be developed, tested, and deployed by different teams using different frameworks, while Vercel handles routing on its global network.

## Key Concepts

- **Default app** — the main application containing `microfrontends.json`. Serves any request not matched by a child app.
- **Child apps** — additional applications with a `routing` array of path patterns they handle.
- **Path-based routing** — Vercel reads `microfrontends.json` from the default app's deployment and routes requests to the matching microfrontend.
- **Asset prefix** — a unique path prefix for static assets (JS, CSS, images) to prevent collisions. Auto-generated as `vc-ap-<hash>` by default.
- **Independent deployments** — each microfrontend deploys independently. Vercel resolves the correct deployment for each.

## Supported Frameworks

- **Next.js** (App Router + Pages Router) — `withMicrofrontends` config wrapper + middleware
- **SvelteKit** — `withMicrofrontends` config wrapper + Vite plugin (`experimental/sveltekit`, `experimental/vite`)
- **React Router** — Vite plugin (`experimental/vite`)
- **Vite** — generic Vite plugin (`experimental/vite`)

## Quickstart

1. **Create a group** in the Vercel Dashboard: Settings → Microfrontends → Create Group.

2. **Add `microfrontends.json`** at the root of the default application:

```json
{
  "$schema": "https://openapi.vercel.sh/microfrontends.json",
  "applications": {
    "web": {
      "development": { "fallback": "your-production-domain.vercel.app" }
    },
    "docs": {
      "routing": [{ "paths": ["/docs/:path*"] }]
    }
  }
}
```

Application names must match Vercel project names. The app without `routing` is the default — exactly one required.

3. **Install** in every microfrontend: `pnpm i @vercel/microfrontends`

4. **Framework integration** in every microfrontend:

**Next.js:**
```ts
// next.config.ts
import { withMicrofrontends } from '@vercel/microfrontends/next/config';
export default withMicrofrontends(nextConfig);
// Pages Router: withMicrofrontends(nextConfig, { supportPagesRouter: true })
```

**SvelteKit:** wrap config with `withMicrofrontends` from `@vercel/microfrontends/experimental/sveltekit` and add `microfrontends()` Vite plugin from `@vercel/microfrontends/experimental/vite`.

**React Router / Vite:** add `microfrontends()` Vite plugin from `@vercel/microfrontends/experimental/vite`.

5. **Local proxy** — with Turborepo, runs automatically via `turbo dev`. Without it, add `"proxy": "microfrontends proxy --local-apps web"` to scripts and visit `http://localhost:3024`.

6. **Deploy** — push to Vercel. Config takes effect once `microfrontends.json` is deployed to production.

## CLI Commands

- `microfrontends proxy [filePath] --local-apps <names...>` — start the local dev proxy
- `microfrontends port` — print the auto-assigned dev port for the current app

## Finding Detailed Information

This skill includes detailed reference documentation in the `references/` directory. **Do not read all references upfront.** Instead, search or grep for the specific topic when needed:

- **`microfrontends.json` schema, field details, naming, file naming, examples** → search `references/configuration.md`
- **Path expressions, asset prefixes, flag-controlled routing, middleware setup** → search `references/path-routing.md`
- **Local proxy setup, polyrepo config, Turborepo, ports, protected deployment fallbacks** → search `references/local-development.md`
- **Adding/removing projects, fallback environments, navigation optimizations, observability** → search `references/managing-microfrontends.md`
- **Testing utilities (`validateMiddlewareConfig`, `validateRouting`, etc.), debug headers, common issues** → search `references/troubleshooting.md`

When the user asks about a specific topic, use grep or search over the relevant reference file to find the answer without loading all references into context.
