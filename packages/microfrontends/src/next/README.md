# @vercel/microfrontends/next

Utilities for automatically configuring Next.js apps to work with your micro-frontend config.

## Exposes

### @vercel/microfrontends/next/config

1. `withMicroFrontends` - A Next.js config wrapper that automatically configures the Next.js app to work with your micro-frontend config

### @vercel/microfrontends/next/client

1. `Link` - A zone aware `Link` component that automatically works with your micro-frontend config
2. `Prefetch` - Utilities to automatically prefetch visible micro-frontend routes

# Migration Issues

1. Server actions - children need the default config, the production url, and the preview url
2.

Footer
