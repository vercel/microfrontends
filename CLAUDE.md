# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for `@vercel/microfrontends`, a library that enables splitting large applications into independently developed and deployed microfrontends on Vercel. The package provides generic platform support for microfrontends in multiple frameworks, such as Next.js, SvelteKit, React Router, Vite, and React.

## Repository Structure

- `packages/microfrontends/` - The main `@vercel/microfrontends` package (the only publishable package)
- `examples/` - Working examples of microfrontend implementations (nextjs-app, nextjs-pages, react-router, single-spa, sveltekit, etc.)

## Technologies

- This is a TypeScript codebase
- Use pnpm for package management
- Turbo manages the monorepo build pipeline
- The package uses dual ESM/CJS exports via tsup
- Follow Vercel style guide (configured via `@vercel/style-guide`)
- Be familiar with Module Federation, single-spa, and Next.js Multi-Zones

## Common Commands

- `pnpm build` - Build all packages using Turbo
- `pnpm test` - Run unit tests for all packages
- `pnpm lint` - Run ESLint on all packages
- `pnpm format` - Format all files with Prettier
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm checks` - Run build, lint, test, and typecheck on all packages (run before submitting PRs)

When running commands for a specific application, do not `cd` into the directory. Run commands from the root. The above commands can be run for a particular package by using a filter option: `pnpm checks -F <package name>`. Use this.

Make sure that `pnpm checks` is successful for the entire repository when verifying a change.

### Dev examples

- `pnpm dev:nextjs-app` - Run the Next.js App Router example
- `pnpm dev:nextjs-pages` - Run the Next.js Pages Router example
- `pnpm dev:react-router` - Run the React Router example
- `pnpm dev:single-spa` - Run the single-spa example
- `pnpm dev:sveltekit` - Run the SvelteKit example

When testing a change, make sure that these dev commands all start up the server successfully. If the server is running and there are no errors after 30 seconds, consider that successful.

### NPM Package Management

- `pnpm changeset` - Create a changeset for releasing
- `pnpm version-packages` - Version packages based on changesets

## Architecture

### Configuration

The microfrontends configuration is defined in `microfrontends.json` (or `.jsonc`) files that live in each application. The schema is at `packages/microfrontends/schema/schema.json`.

Key configuration concepts:

- **Applications**: Named microfrontends that map to Vercel project names
- **Routing**: Path patterns that determine which microfrontend handles which routes
- **Development**: Local and fallback URLs for development
- **Asset Prefix**: Unique identifiers for static assets per microfrontend
- **Flags**: Feature flags that conditionally route requests to different microfrontends

### Core Components

1. **Config Layer** (`src/config/`)

   - `microfrontends-config/` - Configuration parsing and validation
   - `microfrontends/server/` - Server-side configuration utilities
   - `overrides/` - Routing overrides
   - `well-known/` - Well-known endpoints for client-side

2. **Next.js Integration** (`src/next/`)

   - `config/` - `withMicrofrontends()` wrapper that transforms Next.js config
   - `middleware/` - Routing middleware for Next.js that handles path matching and zone routing when using feature flags
   - `client/` - Client-side utilities (Link component, prefetch)
   - `testing/` - Testing utilities for Next.js microfrontends

3. **Other Framework Support** (`src/`)

   - `sveltekit/` - SvelteKit integration
   - `vite/` - Vite integration

4. **CLI & Local Proxy** (`src/bin/`)
   - `local-proxy.ts` - HTTP proxy for local development that routes requests between locally running microfrontends or falls back to production
   - `index.ts` - CLI commands (`microfrontends proxy`, `microfrontends port`)
