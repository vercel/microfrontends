import { readFileSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import pkg from '../../package.json';
import { generateSchema } from './generate';

describe('json schema', () => {
  it('package.json export is valid', () => {
    const pathToSchema = pkg.exports['./schema.json'];
    expect(pathToSchema).toEqual('./schema/schema.json');
    // make sure the file exists
    expect(() => readFileSync(pathToSchema)).not.toThrow();
  });

  it('schema is updated, run `pnpm -F @vercel/microfrontends generate:schema`', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'mfe-schema-test-'));
    const pathToExpectedSchema = path.join(tempDir, 'expected-schema.json');
    generateSchema({ destination: pathToExpectedSchema });
    const pathToActualSchema = pkg.exports['./schema.json'];
    expect(JSON.parse(readFileSync(pathToExpectedSchema).toString())).toEqual(
      JSON.parse(readFileSync(pathToActualSchema).toString()),
    );
  });
});
