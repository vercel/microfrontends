#!/usr/bin/env node
/**
 * Generates `src/bin/geist-font.ts`: Geist Sans 400 and 500, subset for the
 * local proxy error page and embedded as base64 woff2 data URLs.
 *
 * Run by hand from the repository root, then commit the output:
 *
 *   pnpm -F @vercel/microfrontends generate:geist-font
 *
 * Rerun it when:
 * - the `geist` devDependency is upgraded,
 * - the error page starts using another weight, or CSS (ours or the Vercel
 *   brand stylesheet's `.vbg-report`) turns on an OpenType feature not in
 *   `FEATURES` below,
 * - the page's own text needs a character outside `CORE` (the unit tests
 *   fail when the template's text does).
 *
 * Each weight gets two files:
 * - core: ASCII plus curly quotes, en/em dashes, and the ellipsis. Embedded on
 *   every page.
 * - full: core plus Latin-1 Supplement, Latin Extended-A, Greek, and
 *   Cyrillic. Embedded instead of the core file only when that weight's text
 *   needs one of the extra characters. A separate extended-only file would be
 *   split from the core into its own font run, losing kerning and mark
 *   positioning between the two (for example "Té").
 *
 * Application names come straight from microfrontends.json and Vercel allows
 * non-English project names, so Greek and Cyrillic are kept. Anything else
 * (CJK, Vietnamese, combining marks, ...) falls back to the system fonts in
 * the page's font stack.
 *
 * Kept OpenType features are the ones the page can apply. Browsers turn on
 * kern, liga, ccmp, mark, and mkmk by default (Geist has no calt, clig, or
 * rlig), and the brand stylesheet adds ss11 on `.vbg-report`. locl is dropped
 * because the page is always `lang="en"`. TrueType hinting is kept: Windows
 * renders with it.
 *
 * Geist's OFL declares no Reserved Font Name, so the subsets keep the
 * original font names. The copyright and license name records are kept.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import * as wawoff2 from 'wawoff2';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(root, 'src/bin/geist-font.ts');

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const CORE = [
  ...range(0x20, 0x7e),
  0x2013, // – en dash
  0x2014, // — em dash
  0x2018, // ‘
  0x2019, // ’
  0x201c, // “
  0x201d, // ”
  0x2026, // … ellipsis
];
const EXTENDED = [
  ...range(0xa0, 0xff), // Latin-1 Supplement
  ...range(0x100, 0x17f), // Latin Extended-A
  ...range(0x370, 0x3ff), // Greek and Coptic (Geist has only a few)
  ...range(0x400, 0x52f), // Cyrillic and Cyrillic Supplement
];
const FEATURES = ['kern', 'liga', 'ccmp', 'mark', 'mkmk', 'ss11'];
/** Family, style, version, PostScript name, copyright, license. */
const NAME_IDS = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17];
const HINTING_TABLES = ['fpgm', 'prep', 'cvt ', 'gasp'];

const WEIGHTS = [
  { weight: 400, file: 'Geist-Regular.woff2' },
  { weight: 500, file: 'Geist-Medium.woff2' },
] as const;

// ---------------------------------------------------------------------------
// HarfBuzz hb-subset, called through the raw exports of harfbuzzjs's
// harfbuzz-subset.wasm (its JavaScript wrapper doesn't cover subsetting).

const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SUBSET_SETS_UNICODE = 1;
const HB_SUBSET_SETS_NAME_ID = 4;
const HB_SUBSET_SETS_LAYOUT_FEATURE_TAG = 6;
/**
 * Keep the glyph names in the post table. Without them hb-subset writes a
 * version 3 post table, and macOS (Chrome, Safari, and Firefox alike) then
 * renders the same outlines differently at 1x, visible in pixel diffs.
 */
const HB_SUBSET_FLAGS_GLYPH_NAMES = 0x80;

interface HarfBuzzSubset {
  memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  free: (ptr: number) => void;
  hb_blob_create: (
    data: number,
    length: number,
    mode: number,
    userData: number,
    destroy: number,
  ) => number;
  hb_blob_destroy: (blob: number) => void;
  hb_blob_get_length: (blob: number) => number;
  hb_blob_get_data: (blob: number, length: number) => number;
  hb_face_create: (blob: number, index: number) => number;
  hb_face_destroy: (face: number) => void;
  hb_face_reference_blob: (face: number) => number;
  hb_set_add: (set: number, value: number) => void;
  hb_set_clear: (set: number) => void;
  hb_subset_input_create_or_fail: () => number;
  hb_subset_input_destroy: (input: number) => void;
  hb_subset_input_set: (input: number, setType: number) => number;
  hb_subset_input_get_flags: (input: number) => number;
  hb_subset_input_set_flags: (input: number, flags: number) => void;
  hb_subset_or_fail: (face: number, input: number) => number;
}

async function loadHarfBuzz(): Promise<HarfBuzzSubset> {
  const wasm = readFileSync(
    require.resolve('harfbuzzjs/dist/harfbuzz-subset.wasm'),
  );
  const { instance } = await WebAssembly.instantiate(wasm);
  return instance.exports as unknown as HarfBuzzSubset;
}

/**
 * wawoff2 returns a view into its WebAssembly memory, which its next call
 * overwrites, so copy every result.
 */
async function compress(ttf: Uint8Array): Promise<Uint8Array> {
  return (await wawoff2.compress(ttf)).slice();
}

async function decompress(woff2: Uint8Array): Promise<Uint8Array> {
  return (await wawoff2.decompress(woff2)).slice();
}

function tag(name: string): number {
  return (
    ((name.charCodeAt(0) << 24) |
      (name.charCodeAt(1) << 16) |
      (name.charCodeAt(2) << 8) |
      name.charCodeAt(3)) >>>
    0
  );
}

function subset(
  hb: HarfBuzzSubset,
  ttf: Uint8Array,
  unicodes: readonly number[],
): Uint8Array {
  const ptr = hb.malloc(ttf.byteLength);
  new Uint8Array(hb.memory.buffer).set(ttf, ptr);
  const blob = hb.hb_blob_create(
    ptr,
    ttf.byteLength,
    HB_MEMORY_MODE_WRITABLE,
    0,
    0,
  );
  const face = hb.hb_face_create(blob, 0);
  hb.hb_blob_destroy(blob);

  const input = hb.hb_subset_input_create_or_fail();
  if (!input) throw new Error('hb_subset_input_create_or_fail failed');
  const unicodeSet = hb.hb_subset_input_set(input, HB_SUBSET_SETS_UNICODE);
  for (const codepoint of unicodes) hb.hb_set_add(unicodeSet, codepoint);
  const featureSet = hb.hb_subset_input_set(
    input,
    HB_SUBSET_SETS_LAYOUT_FEATURE_TAG,
  );
  hb.hb_set_clear(featureSet);
  for (const feature of FEATURES) hb.hb_set_add(featureSet, tag(feature));
  const nameSet = hb.hb_subset_input_set(input, HB_SUBSET_SETS_NAME_ID);
  hb.hb_set_clear(nameSet);
  for (const id of NAME_IDS) hb.hb_set_add(nameSet, id);

  hb.hb_subset_input_set_flags(
    input,
    (hb.hb_subset_input_get_flags(input) | HB_SUBSET_FLAGS_GLYPH_NAMES) >>> 0,
  );

  const result = hb.hb_subset_or_fail(face, input);
  hb.hb_subset_input_destroy(input);
  try {
    if (!result) throw new Error('hb_subset_or_fail failed');
    const resultBlob = hb.hb_face_reference_blob(result);
    const length = hb.hb_blob_get_length(resultBlob);
    const data = hb.hb_blob_get_data(resultBlob, 0);
    const bytes = new Uint8Array(hb.memory.buffer, data, length).slice();
    hb.hb_blob_destroy(resultBlob);
    if (length === 0) throw new Error('hb-subset returned an empty font');
    return bytes;
  } finally {
    if (result) hb.hb_face_destroy(result);
    hb.hb_face_destroy(face);
    hb.free(ptr);
  }
}

// ---------------------------------------------------------------------------
// Checks on the generated fonts, against the source font.

interface Font {
  numGlyphs: number;
  characterSet: number[];
  unitsPerEm: number;
  directory: { tables: Record<string, unknown> };
  getName: (key: string) => string | null;
  glyphForCodePoint: (codepoint: number) => { advanceWidth: number };
  GSUB?: { featureList: { tag: string }[] };
  GPOS?: { featureList: { tag: string }[] };
  hhea: Record<string, number>;
  post: { version: number };
  'OS/2': Record<string, number>;
}

function openFont(bytes: Uint8Array): Font {
  return fontkit.create(bytes) as Font;
}

function features(font: Font): string[] {
  return [
    ...new Set(
      [
        ...(font.GSUB?.featureList ?? []),
        ...(font.GPOS?.featureList ?? []),
      ].map((feature) => feature.tag),
    ),
  ].sort();
}

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function verify(
  label: string,
  source: Font,
  output: Font,
  wanted: readonly number[],
): void {
  const expected = wanted
    .filter((codepoint) => source.characterSet.includes(codepoint))
    .sort((a, b) => a - b);
  const actual = [...output.characterSet].sort((a, b) => a - b);
  check(
    expected.join() === actual.join(),
    `${label}: cmap has ${actual.length} code points, expected ${expected.length}`,
  );
  for (const codepoint of actual) {
    check(
      source.glyphForCodePoint(codepoint).advanceWidth ===
        output.glyphForCodePoint(codepoint).advanceWidth,
      `${label}: advance width of U+${codepoint.toString(16)} changed`,
    );
  }
  check(
    source.unitsPerEm === output.unitsPerEm,
    `${label}: unitsPerEm changed`,
  );
  check(
    source.post.version === output.post.version,
    `${label}: post table version ${output.post.version}, source has ${source.post.version}`,
  );
  for (const key of ['ascent', 'descent', 'lineGap']) {
    check(
      source.hhea[key] === output.hhea[key],
      `${label}: hhea.${key} changed`,
    );
  }
  for (const key of [
    'typoAscender',
    'typoDescender',
    'typoLineGap',
    'winAscent',
    'winDescent',
    'fsSelection',
    'usWeightClass',
  ]) {
    check(
      JSON.stringify(source['OS/2'][key]) ===
        JSON.stringify(output['OS/2'][key]),
      `${label}: OS/2.${key} changed`,
    );
  }
  for (const key of [
    'fontFamily',
    'fontSubfamily',
    'fullName',
    'postscriptName',
    'copyright',
    'license',
    'licenseURL',
  ]) {
    check(
      source.getName(key) === output.getName(key),
      `${label}: name "${key}" changed`,
    );
  }
  // hb-subset prunes features with nothing left to apply to (mark and mkmk
  // only position combining marks, which neither file has), so check that
  // nothing outside FEATURES survived; verifyShaping checks the rest.
  const kept = features(output);
  check(
    kept.every((feature) => FEATURES.includes(feature)),
    `${label}: unexpected features ${kept.join()}`,
  );
  check(
    ['kern', 'liga', 'ss11'].every((feature) => kept.includes(feature)),
    `${label}: lost kern, liga, or ss11 (kept ${kept.join()})`,
  );
  for (const table of HINTING_TABLES) {
    check(
      table in output.directory.tables === table in source.directory.tables,
      `${label}: hinting table "${table}" was not kept`,
    );
  }
}

/**
 * Feature settings the page renders with: browser defaults (when the brand
 * stylesheet doesn't load) and `.vbg-report`'s `"rlig" 1, "calt" 0, "ss11" 1`.
 */
const SHAPING_STATES = [[], ['rlig', '-calt', 'ss11']];

type HarfBuzz = typeof import('harfbuzzjs');

/**
 * Shapes every ordered pair of the subset's characters with the source font
 * and the subset, and checks that both draw the same outlines at the same
 * positions. This catches kerning, ligatures, and substitutions lost or
 * changed by subsetting.
 */
function verifyShaping(
  harfbuzz: HarfBuzz,
  label: string,
  sourceTtf: Uint8Array,
  outputTtf: Uint8Array,
  codepoints: number[],
): void {
  const open = (ttf: Uint8Array) => {
    const font = new harfbuzz.Font(
      new harfbuzz.Face(new harfbuzz.Blob(ttf), 0),
    );
    const paths = new Map<number, string>();
    return {
      font,
      path: (glyph: number): string => {
        let path = paths.get(glyph);
        if (path === undefined) {
          path = font.glyphToPath(glyph);
          paths.set(glyph, path);
        }
        return path;
      },
    };
  };
  const source = open(sourceTtf);
  const output = open(outputTtf);
  const chars = codepoints.map((codepoint) => String.fromCodePoint(codepoint));

  const run = (
    font: ReturnType<typeof open>,
    text: string,
    features: string[],
  ): string[] => {
    const buffer = new harfbuzz.Buffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();
    buffer.setLanguage('en');
    harfbuzz.shape(
      font.font,
      buffer,
      features.map((feature) => {
        const parsed = harfbuzz.Feature.fromString(feature);
        if (!parsed) throw new Error(`invalid feature ${feature}`);
        return parsed;
      }),
    );
    const infos = buffer.getGlyphInfos();
    const positions = buffer.getGlyphPositions();
    return infos.map((info, i) => {
      const position = positions[i];
      if (!position) throw new Error(`${label}: glyph ${i} has no position`);
      return `${info.cluster} ${position.xAdvance},${position.yAdvance},${position.xOffset},${position.yOffset} ${font.path(info.codepoint)}`;
    });
  };

  for (const features of SHAPING_STATES) {
    for (const first of chars) {
      // "a" followed by every character, each followed by "a" again, covers
      // both orders of every pair that starts or ends with "a".
      const text = first + chars.map((char) => char + first).join('');
      const expected = run(source, text, features);
      const actual = run(output, text, features);
      for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
        check(
          expected[i] === actual[i],
          `${label}: shaping differs from the source font for ${JSON.stringify(
            text.slice(0, 40),
          )}... with features [${features.join()}] at glyph ${i}: expected ${expected[i]?.slice(0, 120)} got ${actual[i]?.slice(0, 120)}`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Output.

/** `U+20-7E,U+2013-2014,...` from a set of code points. */
function unicodeRange(codepoints: readonly number[]): string {
  const runs: [number, number][] = [];
  for (const codepoint of [...codepoints].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && codepoint === last[1] + 1) last[1] = codepoint;
    else runs.push([codepoint, codepoint]);
  }
  const hex = (codepoint: number): string =>
    codepoint.toString(16).toUpperCase();
  return runs
    .map(([start, end]) =>
      start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`,
    )
    .join(',');
}

/** A character class matching exactly these code points, e.g. `[\u00a0-\u00ff]`. */
function characterClass(codepoints: readonly number[]): string {
  const u = (codepoint: number): string =>
    `\\u${codepoint.toString(16).padStart(4, '0')}`;
  return `[${unicodeRange(codepoints)
    .split(',')
    .map((part) =>
      part
        .slice(2)
        .split('-')
        .map((h) => u(parseInt(h, 16)))
        .join('-'),
    )
    .join('')}]`;
}

async function main(): Promise<void> {
  const hb = await loadHarfBuzz();
  const harfbuzz = await import('harfbuzzjs');
  // `geist` doesn't export its package.json; read it from node_modules.
  const geistPackage = join(root, 'node_modules/geist');
  const { version } = JSON.parse(
    readFileSync(join(geistPackage, 'package.json'), 'utf8'),
  ) as { version: string };

  const faces: string[] = [];
  const summary: string[] = [];
  let coreSet: number[] | undefined;
  let extendedSet: number[] | undefined;

  for (const { weight, file } of WEIGHTS) {
    const sourcePath = join(geistPackage, 'dist/fonts/geist-sans', file);
    const sourceWoff2 = new Uint8Array(readFileSync(sourcePath));
    const sourceTtf = await decompress(sourceWoff2);
    const source = openFont(sourceTtf);

    const files: Partial<
      Record<'core' | 'full', { woff2: Uint8Array; codepoints: number[] }>
    > = {};
    for (const [name, wanted] of [
      ['core', CORE],
      ['full', [...CORE, ...EXTENDED]],
    ] as const) {
      const ttf = subset(hb, sourceTtf, wanted);
      const woff2 = await compress(ttf);
      const label = `${file} ${name}`;
      // Check both the subset and its woff2 round trip.
      verify(label, source, openFont(ttf), wanted);
      verify(`${label} (woff2)`, source, openFont(woff2), wanted);
      verifyShaping(
        harfbuzz,
        label,
        sourceTtf,
        await decompress(woff2),
        openFont(woff2).characterSet,
      );
      const codepoints = openFont(woff2).characterSet;
      files[name] = { woff2, codepoints };
      summary.push(
        `${file} ${name}: ${woff2.length} bytes, ${openFont(woff2).numGlyphs} glyphs, ${codepoints.length} code points (source ${sourceWoff2.length} bytes, ${source.numGlyphs} glyphs)`,
      );
    }

    const { core: coreFile, full: fullFile } = files;
    if (!coreFile || !fullFile) throw new Error(`${file}: missing a subset`);
    const core = coreFile.codepoints;
    const extended = fullFile.codepoints.filter((c) => !core.includes(c));
    // The page picks core or full with one character list for both weights.
    if (coreSet && coreSet.join() !== core.join()) {
      throw new Error(`${file}: core characters differ between weights`);
    }
    if (extendedSet && extendedSet.join() !== extended.join()) {
      throw new Error(`${file}: extended characters differ between weights`);
    }
    coreSet = core;
    extendedSet = extended;

    faces.push(`  ${weight}: {
    core: {
      src: 'data:font/woff2;base64,${Buffer.from(coreFile.woff2).toString('base64')}',
      unicodeRange: '${unicodeRange(coreFile.codepoints)}',
    },
    full: {
      src: 'data:font/woff2;base64,${Buffer.from(fullFile.woff2).toString('base64')}',
      unicodeRange: '${unicodeRange(fullFile.codepoints)}',
    },
  },`);
  }

  if (!coreSet || !extendedSet) throw new Error('no fonts generated');

  const output = `/**
 * Geist Sans 400 and 500, embedded so the local proxy pages render in Geist
 * without loading anything from the network.
 *
 * GENERATED by \`scripts/subset-geist-font.ts\` from Geist-Regular.woff2 and
 * Geist-Medium.woff2 in the \`geist\` npm package, version ${version}
 * (https://github.com/vercel/geist-font). Do not edit; see the script for how
 * the fonts are subset and when to rerun it.
 *
 * Copyright (c) 2023 Vercel, in collaboration with basement.studio.
 * Licensed under the SIL Open Font License, Version 1.1
 * (https://openfontlicense.org). The copyright and license are also kept in
 * each font file's metadata.
 */

export interface GeistFontFile {
  /** woff2 data URL. */
  src: string;
  /** Exactly the characters the file contains. */
  unicodeRange: string;
}

/**
 * Per weight: \`core\` covers ASCII and common punctuation; \`full\` is core
 * plus Latin-1 Supplement, Latin Extended-A, Greek, and Cyrillic, used
 * instead of core when text needs those characters.
 */
export const GEIST_SANS: Record<400 | 500, { core: GeistFontFile; full: GeistFontFile }> = {
${faces.join('\n')}
};

/** Characters in the \`full\` files but not in \`core\`. */
export const GEIST_EXTENDED_CHARACTERS = /${characterClass(extendedSet)}/;
`;

  writeFileSync(outputPath, output);
  for (const line of summary) console.log(line);
  console.log(`Wrote ${relative(process.cwd(), outputPath)}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
