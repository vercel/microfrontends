import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['config.ts'],
  format: ['esm', 'cjs'],
  splitting: false,
  sourcemap: true,
  minify: false,
  clean: true,
  skipNodeModulesBundle: true,
  dts: true,
  external: ['node_modules'],
});
