// Minimal declarations for the font tools used by subset-geist-font.ts,
// which ship without types.

declare module 'fontkit' {
  export function create(buffer: Uint8Array): unknown;
}

declare module 'wawoff2' {
  export function compress(ttf: Uint8Array): Promise<Uint8Array>;
  export function decompress(woff2: Uint8Array): Promise<Uint8Array>;
}
