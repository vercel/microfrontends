# Vercel Microfrontends

An agent skill for building, configuring, and deploying microfrontends on Vercel.

## Structure

- `SKILL.md` - Core skill with concepts, quickstart, and pointers to references
- `references/` - Detailed reference documentation
  - `configuration.md` - `microfrontends.json` schema, field details, naming, examples
  - `path-routing.md` - Path expressions, asset prefixes, flag-controlled routing
  - `local-development.md` - Local proxy setup, polyrepo config, deployment protection
  - `managing-microfrontends.md` - Adding/removing projects, fallbacks, navigation, observability
  - `troubleshooting.md` - Testing utilities, debug headers, common issues
- `metadata.json` - Skill metadata (skill version, organization, references)

## Install

```bash
npx skills add vercel/microfrontends
```

## Learn More

- [Vercel Microfrontends Docs](https://vercel.com/docs/microfrontends)
- [`@vercel/microfrontends` on npm](https://www.npmjs.com/package/@vercel/microfrontends)
