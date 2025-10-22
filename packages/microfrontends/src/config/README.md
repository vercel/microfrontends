# Config V2 Migration Guide

## Breaking Changes

1. Overrides is no longer a class (no instance vars were needed)
   1. `validateOverrideDomain` has been removed due to the removal of the project name from the config
2. Client Config is now a class for consistency with the others
3. Class names have changed (see micro-frontend-config docs)
4. All instances of zone have been replaced with application
5. getClientConfigFromEnv, and getWellKnownClientData signature has changed (now requires config string to be passed in to ensure it is framework agnostic)
