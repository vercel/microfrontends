import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'node:util';

Object.assign(global, { TextDecoder, TextEncoder });

// crypto mock, not available in JSDOM
// https://github.com/jsdom/jsdom/issues/1612
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
});

Object.defineProperty(globalThis, 'structuredClone', {
  value: (data: unknown): unknown => JSON.parse(JSON.stringify(data)),
});
