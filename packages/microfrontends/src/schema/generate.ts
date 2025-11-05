import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createGenerator } from 'ts-json-schema-generator';
import { fileURLToPath } from '../test-utils/file-url-to-path';

const dir = fileURLToPath(new URL('.', import.meta.url));

/**
 * The type to use as the entrypoint when generating the schema definition from the types in schema.ts
 */
export const SCHEMA_ROOT = 'Config' as const;

export function generateSchema({ destination }: { destination: string }): void {
  // build a generator from the config types
  const generator = createGenerator({
    path: '../config/schema/types.ts',
    tsconfig: join(dir, '../../tsconfig.json'),
    type: 'Config',
    // allow additional properties for backwards compatibility
    skipTypeCheck: true,
    additionalProperties: false,
  });

  // generate schema
  const schema = JSON.stringify(generator.createSchema(SCHEMA_ROOT), null, 2);
  // ensure destination directory exists
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, schema);
}
