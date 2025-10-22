import { defineConfig, type Options } from 'tsup';

export const OUT_DIR = 'dist';

const COMMON_CFG: Options = {
  outDir: OUT_DIR,
  format: ['esm', 'cjs'],
  splitting: false,
  sourcemap: true,
  minify: false,
  skipNodeModulesBundle: true,
  dts: true,
  external: ['node_modules', 'react'],
};

// eslint-disable-next-line import/no-default-export
export default defineConfig([
  {
    ...COMMON_CFG,
    entry: {
      validation: 'src/schema/validation.ts',
      config: 'src/config/microfrontends-config/isomorphic/index.ts',
      'experimental/sveltekit': 'src/sveltekit/index.ts',
      'experimental/vite': 'src/vite/index.ts',
      overrides: 'src/config/overrides/index.ts',
      'microfrontends/server': 'src/config/microfrontends/server/index.ts',
      'microfrontends/utils': 'src/config/microfrontends/utils/index.ts',
      schema: 'src/config/schema/index.ts',
      'next/config': 'src/next/config/index.ts',
      'next/middleware': 'src/next/middleware/index.ts',
      'next/testing': 'src/next/testing/index.ts',
    },
  },
  {
    ...COMMON_CFG,
    minify: process.env.NODE_ENV !== 'development',
    entry: {
      'next/client': 'src/next/client/index.ts',
    },
    banner: {
      js: '"use client";',
    },
  },
  {
    ...COMMON_CFG,
    format: ['cjs'],
    dts: false,
    sourcemap: false,
    entry: {
      'bin/cli': 'src/bin/index.ts',
    },
  },
  {
    ...COMMON_CFG,
    entry: {
      'utils/mfe-port': 'src/utils/mfe-port.ts',
    },
  },
]);
