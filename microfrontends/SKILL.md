---
name: vercel-microfrontends
description: Guide for building, configuring, and deploying microfrontends on Vercel. Use this skill when the user mentions microfrontends, multi-zones, splitting an app across teams, independent deployments, cross-app routing, incremental migration, composing multiple frontends under one domain, microfrontends.json, @vercel/microfrontends, the microfrontends local proxy, or path-based routing between Vercel projects. Also use when the user asks about shared layouts across projects, navigation between microfrontends, fallback environments, asset prefixes, or feature flag controlled routing.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel Microfrontends

Microfrontends allow you to split a single application into smaller, independently deployable units that render as one cohesive application for users. Different teams using different technologies can develop, test, and deploy each microfrontend while Vercel handles connecting them and routing requests on the global network.

## Core Concepts

- **Default app**: The main application that contains the `microfrontends.json` configuration file. It handles routing decisions and serves any request not handled by another microfrontend.
- **Child apps**: Additional applications that serve specific path patterns. Each child app has a `routing` array defining which paths it handles.
- **Shared domain**: All microfrontends appear under a single domain, so relative paths resolve correctly across microfrontends.
- **Path-based routing**: Vercel's network reads `microfrontends.json` from the default app's live deployment and routes requests to the correct microfrontend based on URL path patterns.
- **Independent deployments**: Each microfrontend can be deployed independently. Vercel automatically resolves which deployment to use for each microfrontend in the group.
- **Asset prefix**: A unique path prefix prepended to static asset URLs (JS, CSS, images) to avoid collisions between microfrontends. Auto-generated as `vc-ap-<hash>` by default.

## Supported Frameworks

`@vercel/microfrontends` has integrations for:
- **Next.js** (App Router and Pages Router) — `withMicrofrontends` config wrapper + middleware for flagged routing
- **SvelteKit** — `withMicrofrontends` SvelteKit config wrapper + Vite plugin
- **React Router** — Vite plugin
- **Vite** — generic Vite plugin
- **Other frameworks** — manual asset prefix setup

## Quickstart

### 1. Create a microfrontends group

In the Vercel Dashboard, go to **Settings → Microfrontends → Create Group**. Add projects and designate one as the default application.

### 2. Define `microfrontends.json`

Add a `microfrontends.json` file at the root of the **default application**:

```json
{
  "$schema": "https://openapi.vercel.sh/microfrontends.json",
  "applications": {
    "web": {
      "development": {
        "fallback": "your-production-domain.vercel.app"
      }
    },
    "docs": {
      "routing": [
        {
          "group": "docs",
          "paths": ["/docs/:path*"]
        }
      ]
    }
  }
}
```

Application names must match the Vercel project names. The application without a `routing` field is the default app — there must be exactly one.

### 3. Install the package

In **every** microfrontend application:

```bash
pnpm i @vercel/microfrontends
```

### 4. Set up framework integration

Apply the framework integration in **every** microfrontend (default app and all child apps).

**Next.js** — wrap your config with `withMicrofrontends`:

```ts
// next.config.ts
import { withMicrofrontends } from '@vercel/microfrontends/next/config';

const nextConfig = { /* ... */ };
export default withMicrofrontends(nextConfig);
```

> For Pages Router support, pass `{ supportPagesRouter: true }` as the second argument to enable proper webpack chunking.

**SvelteKit** — wrap your SvelteKit config **and** add the Vite plugin:

```js
// svelte.config.js
import { withMicrofrontends } from '@vercel/microfrontends/experimental/sveltekit';

const config = withMicrofrontends({
  kit: { adapter: adapter() },
});
export default config;
```

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
export default defineConfig({ plugins: [microfrontends(), sveltekit()] });
```

**React Router** — add the Vite plugin (with optional `basePath` for path-prefixed apps):

```ts
// vite.config.ts
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
export default defineConfig({ plugins: [microfrontends({ basePath: '/docs' })] });
```

**Vite** — add the Vite plugin:

```ts
// vite.config.ts
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
export default defineConfig({ plugins: [microfrontends()] });
```

### 5. Set up the local development proxy

With **Turborepo** (recommended): the proxy starts automatically when running `turbo dev`.

Without Turborepo, add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --port $(microfrontends port)",
    "proxy": "microfrontends proxy --local-apps web"
  }
}
```

Then visit the proxy URL (default `http://localhost:3024`).

### Polyrepo setup

If your microfrontends live in **separate repositories**, the `microfrontends.json` file only exists in the default app's repo. Each child app repo needs access to it:

```bash
# Option A: Pull from Vercel (requires Vercel CLI 44.2.2+)
vercel microfrontends pull

# Option B: Point to a local copy via env var
export VC_MICROFRONTENDS_CONFIG=/path/to/microfrontends.json
```

Then start the proxy manually in each repo (Turborepo auto-detection is not available across repos):

```bash
microfrontends proxy --local-apps your-app-name
```

For full polyrepo details (protected deployment fallbacks, env var setup), consult `references/local-development.md`.

### 6. Deploy

Push to Vercel. The microfrontends configuration takes effect once `microfrontends.json` is deployed to production.

## Key Configuration

The `microfrontends.json` file is the single source of truth for routing. It lives in the default app's root directory.

**Top-level fields:**
- `$schema` — validation schema URL (`https://openapi.vercel.sh/microfrontends.json`)
- `version` — schema version (currently `"1"`)
- `applications` — map of Vercel project names to their configuration
- `options` — optional settings like `localProxyPort` and `disableOverrides`

**Default application fields:**
- `development.fallback` (required) — production URL used as fallback for apps not running locally
- `development.local` — local dev port or host
- `development.task` — dev script name (default: `"dev"`)

**Child application fields:**
- `routing` (required) — array of path groups, each with `paths` and optional `group`/`flag`
- `assetPrefix` — custom asset prefix (default: auto-generated hash)
- `development.local` / `development.task` / `development.fallback` — dev settings
- `packageName` — if Vercel project name differs from `package.json` name

## Common Usage Examples

### Example 1: Basic multi-zone setup with Next.js

A marketing site as default app with docs and blog as child microfrontends:

```json
{
  "$schema": "https://openapi.vercel.sh/microfrontends.json",
  "applications": {
    "marketing": {
      "development": {
        "fallback": "marketing.vercel.app"
      }
    },
    "docs": {
      "routing": [
        { "paths": ["/docs/:path*"] }
      ]
    },
    "blog": {
      "routing": [
        { "paths": ["/blog/:path*"] }
      ]
    }
  }
}
```

### Example 2: Adding a new path to an existing microfrontend

To route `/api-reference` to the `docs` microfrontend, add it to the routing paths:

```json
"docs": {
  "routing": [
    {
      "paths": ["/docs/:path*", "/api-reference/:path*"]
    }
  ]
}
```

Test in Preview first, then merge to production. Use Instant Rollback to revert if needed.

### Example 3: Flag-controlled routing (Next.js only)

Route a path conditionally using a feature flag:

```json
{
  "applications": {
    "web": {
      "development": { "fallback": "web.vercel.app" }
    },
    "new-checkout": {
      "routing": [
        {
          "flag": "enable-new-checkout",
          "paths": ["/checkout/:path*"]
        }
      ]
    }
  }
}
```

Then add middleware in the default app:

```ts
// middleware.ts
import { runMicrofrontendsMiddleware } from '@vercel/microfrontends/next/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = await runMicrofrontendsMiddleware({
    request,
    flagValues: {
      'enable-new-checkout': async () => {
        // Return true/false based on your feature flag logic
        return false;
      },
    },
  });
  if (response) return response;
}

export const config = {
  matcher: [
    '/.well-known/vercel/microfrontends/client-config',
    '/checkout/:path*',
  ],
};
```

## Best Practices

### When to use microfrontends

Microfrontends add operational complexity. They are most valuable when:

- **Multiple teams** need to deploy independently without coordinating release schedules
- **Large applications** have slow builds that can be parallelized by splitting into smaller units
- **Incremental migration** is needed — e.g., moving from Pages Router to App Router, or from an older framework to a modern one, one section at a time
- **Different technology stacks** are required for different parts of the application (e.g., Next.js for marketing, SvelteKit for docs)

If a single team owns the entire app and builds are fast, a monorepo or single app is simpler.

### Deciding where to split

Draw microfrontend boundaries along **path prefixes that align with team ownership**. Good splits:

- `/docs/:path*` → Docs team
- `/blog/:path*` → Content team
- `/dashboard/:path*` → Platform team
- Everything else → Marketing/default team

Avoid splitting pages that frequently link to each other into separate microfrontends, since cross-zone navigations are full page loads (see below).

### Cross-zone navigations

Navigating between microfrontends triggers a **hard navigation** (full page reload), not a client-side transition. Vercel mitigates this with prefetching and prerendering via `PrefetchCrossZoneLinks`, but it's still slower than an in-app navigation. Best practices:

- Keep frequently linked pages in the **same** microfrontend
- Add `PrefetchCrossZoneLinks` to all microfrontend root layouts to optimize cross-zone transitions
- Use the microfrontends `Link` component for cross-zone links (falls back to Next.js `Link` for same-zone)

### Authentication and shared state

Microfrontends share a **single domain**, so cookies and HTTP-level authentication (e.g., session cookies, JWTs) work transparently across all microfrontends without extra configuration. However:

- **React state and context do not carry across zones** — each microfrontend is a separate application with its own React tree
- For shared auth, use cookie-based sessions or token-based auth that works via HTTP headers
- Use [Shared Environment Variables](https://vercel.com/docs/environment-variables/shared-environment-variables) to share secrets like `FLAGS_SECRET` across projects

### Consistent UI

Each microfrontend builds independently, so visual consistency requires intentional effort:

- Use a **shared design system** or component library (e.g., published as an npm package)
- For tighter integration (e.g., shared headers/footers rendered from a single source), consider Module Federation with single-spa (see the `single-spa` example in this repo)
- Ensure consistent CSS framework versions across microfrontends to avoid style drift

### Safe rollout of routing changes

Microfrontend deployments are **not atomic across projects** — the child app and the routing config may deploy at different times. To avoid broken states:

1. **Adding a microfrontend:** Deploy the child app first and verify it works at its own URL. Then add its routing paths to `microfrontends.json` in the default app.
2. **Removing a microfrontend:** Remove the routing paths from `microfrontends.json` first. Then remove the project from the group.
3. **Risky path changes:** Use [flag-controlled routing](references/path-routing.md#flag-controlled-routing) to gradually shift traffic, then remove the flag once stable.
4. **Reverting:** Use [Instant Rollback](https://vercel.com/docs/instant-rollback) on the default app to revert routing changes immediately.

## CLI Commands

The `@vercel/microfrontends` package provides two CLI commands:

- **`microfrontends proxy [configPath] --local-apps <names...>`** — Start the local development proxy. Routes requests to local apps or production fallbacks.
- **`microfrontends port`** — Print the auto-assigned development port for the current application.

## Reference Files

For detailed information on specific topics, consult the following reference files:

- **Path expression syntax and flag-based routing** → consult `references/path-routing.md`
- **`microfrontends.json` schema details, application naming, file naming** → consult `references/configuration.md`
- **Local proxy setup, polyrepo configuration, protected deployment fallbacks** → consult `references/local-development.md`
- **Adding/removing projects, fallback environments, navigation optimizations, observability** → consult `references/managing-microfrontends.md`
- **Debug headers, testing utilities, common issues** → consult `references/troubleshooting.md`
