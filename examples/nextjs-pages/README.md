# Next.js Pages Router Example

This example shows off microfrontends with Next.js Pages Router. There are two applications:

- Dashboard
- Blog

The dashboard is the _default application_ and serves `/` and any route not served by the blog application.

Blog serves `/blog` and `/blog/:path*` (any route that starts with the `/blog` prefix).

## Running locally

To run this example locally, run `pnpm dev:nextjs-pages` from the root of the repository. Then visit `http://localhost:3024` and click around.
