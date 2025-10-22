# Next.js App Router Example

This example shows off microfrontends with Next.js App Router. There are two applications:

- Marketing (default application)
- Docs

Marketing is the _default application_ and serves `/` and any route not served by the blog application.

Docs serves `/docs` and `/docs/:path*` (any route that starts with the `/docs` prefix).

## Running locally

To run this example locally, run `pnpm dev:nextjs-app` from the root of the repository. Then visit `http://localhost:3024` and click around.
