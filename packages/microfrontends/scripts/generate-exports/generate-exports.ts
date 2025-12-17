/* eslint-disable no-console */

import { exec } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import type { Options } from 'tsup';

const STATIC_EXPORTS = {
  './schema.json': './schema/schema.json',
};

type Format = 'cjs' | 'esm' | 'iife';
type ModuleLoadingMethod = 'require' | 'import';
type Export = Partial<Record<ModuleLoadingMethod, string>> | string;
type Exports = Record<string, Export>;
type TypesVersion = Record<string, string[]>;
interface TypesVersions {
  '*': TypesVersion;
}

function extensionToMethod(
  isEsm: boolean,
): Record<string, ModuleLoadingMethod> {
  return {
    '.js': isEsm ? 'import' : 'require',
    '.cjs': 'require',
    '.mjs': 'import',
  };
}

function getExtensions(
  isEsm: boolean,
  formats: string | Format[],
): ('.mjs' | '.cjs' | '.js')[] {
  const formatArray = typeof formats === 'string' ? [formats] : formats;
  return formatArray.map((format) => {
    if (format === 'esm') {
      return !isEsm ? '.mjs' : '.js';
    }
    if (format === 'cjs') {
      return isEsm ? '.cjs' : '.js';
    }

    throw new Error(`unsupported format ${format}`);
  });
}

export function buildExports({
  tsupConfig,
  outDir,
  isEsm,
}: {
  tsupConfig: Options[];
  outDir: string;
  isEsm: boolean;
}): {
  pkgTypesVersions: TypesVersions;
  pkgExports: Exports;
} {
  const pkgTypesVersions: TypesVersions = { '*': {} };
  const pkgExports: Exports = {
    ...STATIC_EXPORTS,
  };

  tsupConfig.forEach((config) => {
    Object.keys(config.entry ?? []).forEach((entry) => {
      // If we aren't generating types, we don't want to export it
      if (!config.dts) {
        return;
      }
      // exports
      if (config.format) {
        const extensions = getExtensions(isEsm, config.format);
        const entries: Export = {};
        extensions.forEach((ext) => {
          const method = extensionToMethod(isEsm)[ext];
          if (method) {
            entries[method] = `./${outDir}/${entry}${ext}`;
          }
        });
        pkgExports[`./${entry}`] = entries;
      }

      // types
      if (config.dts) {
        pkgTypesVersions['*'][entry] = [`./${outDir}/${entry}.d.ts`];
      }
    });
  });

  return {
    pkgTypesVersions,
    pkgExports,
  };
}

export function generateExports({
  tsupConfig,
  outDir,
}: {
  tsupConfig: Options[];
  outDir: string;
}): void {
  console.log('⏶ Generating `package.json` from `tsup.config`');
  let pkgJsonString: string;
  try {
    pkgJsonString = readFileSync('./package.json', 'utf-8');
  } catch (e) {
    console.error('No package.json found in the current directory');
    throw e;
  }
  console.log('  • constructing `exports` and `typesVersions`...');
  const pkgJson = JSON.parse(pkgJsonString) as {
    type?: string;
    typesVersions?: TypesVersions;
    exports?: Exports;
  };
  const { pkgTypesVersions, pkgExports } = buildExports({
    tsupConfig,
    outDir,
    isEsm: pkgJson.type === 'module',
  });

  // update package.json
  if (Object.keys(pkgTypesVersions).length > 0) {
    console.log('  • updating typesVersions...');
    pkgJson.typesVersions = pkgTypesVersions;
  }
  if (Object.keys(pkgExports).length > 0) {
    console.log('  • updating exports...');
    pkgJson.exports = pkgExports;
  }
  // write it back with formatting
  console.log('  • writing package.json...');
  const newPkgJson = `${JSON.stringify(pkgJson, null, 2)}\n`;
  writeFileSync('./package.json', newPkgJson);
  console.log('  • formatting package.json...');
  exec('pnpm exec biome format package.json --write');

  console.log('✓ Done');
}
