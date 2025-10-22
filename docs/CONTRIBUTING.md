# Contributing to `@vercel/microfrontends`

## Running examples locally

## Testing

Before sending a pull request out for review, run `pnpm checks` to run lint, type checking, and unit tests.

### E2E Tests

E2E tests will be run on your pull request automatically.

To run the E2E tests locally, run these commands from the root of the repository in two separate terminals:

```sh
# Start the local development servers
pnpm dev:nextjs-app

# Run the E2E tests
BASE_URL="http://localhost:3000" pnpm test:e2e --filter=nextjs-app-marketing
```

The E2E tests can also be run against a preview or production deployment:

```sh
BASE_URL="https://vercel-microfrontends-example.vercel.app" pnpm test:e2e --filter=nextjs-app-marketing
```
