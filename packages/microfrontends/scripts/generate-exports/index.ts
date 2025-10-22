import type { Options } from 'tsup';
import tsup, { OUT_DIR } from '../../tsup.config';
import { generateExports } from './generate-exports';

generateExports({ tsupConfig: tsup as Options[], outDir: OUT_DIR });
