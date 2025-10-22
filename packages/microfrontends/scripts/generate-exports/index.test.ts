import { readFileSync, writeFileSync } from 'node:fs';
import type { Options } from 'tsup';
import { generateExports, buildExports } from './generate-exports';

jest.mock('node:fs');

describe('buildExports', () => {
  it('should generate pkgExports and pkgTypesVersions from tsupConfig', () => {
    const mockTsupConfig = [
      {
        entry: { index: './src/index.ts' },
        dts: true,
        format: ['esm', 'cjs'],
      },
    ] as Options[];

    const result = buildExports({
      tsupConfig: mockTsupConfig,
      outDir: 'dist',
      isEsm: true,
    });

    expect(result.pkgTypesVersions).toEqual({
      '*': {
        index: ['./dist/index.d.ts'],
      },
    });

    expect(result.pkgExports).toEqual({
      './schema.json': './schema/schema.json',
      './index': {
        import: './dist/index.js',
        require: './dist/index.cjs',
      },
    });
  });

  it('should handle tsupConfig with no dts', () => {
    const mockTsupConfig = [
      {
        entry: { index: './src/index.ts' },
        dts: false,
        format: ['esm', 'cjs'],
      },
    ] as Options[];

    const result = buildExports({
      tsupConfig: mockTsupConfig,
      outDir: 'dist',
      isEsm: true,
    });

    expect(result.pkgTypesVersions).toEqual({ '*': {} });
    expect(result.pkgExports).toEqual({
      './schema.json': './schema/schema.json',
    });
  });

  it('should throw an error for unsupported format', () => {
    const mockTsupConfig = [
      {
        entry: { index: './src/index.ts' },
        dts: true,
        format: ['unsupported'],
      },
    ] as unknown as Options[];

    expect(() =>
      buildExports({
        tsupConfig: mockTsupConfig,
        outDir: 'dist',
        isEsm: true,
      }),
    ).toThrow('unsupported format unsupported');
  });
});

describe('generateExports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if package.json is not found', () => {
    (readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(() =>
      generateExports({
        tsupConfig: [],
        outDir: 'dist',
      }),
    ).toThrow('File not found');

    expect(readFileSync).toHaveBeenCalledWith('./package.json', 'utf-8');
  });

  it('should update package.json with exports and typesVersions', () => {
    const mockPackageJson = JSON.stringify({
      type: 'module',
    });

    (readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

    const mockWriteFileSync = jest.fn();
    (writeFileSync as jest.Mock).mockImplementation(mockWriteFileSync);

    const mockTsupConfig = [
      {
        entry: { index: './src/index.ts' },
        dts: true,
        format: ['esm', 'cjs'],
      },
    ] as Options[];

    generateExports({
      tsupConfig: mockTsupConfig,
      outDir: 'dist',
    });

    const expectedUpdatedPackageJson = JSON.stringify(
      {
        type: 'module',
        typesVersions: {
          '*': {
            index: ['./dist/index.d.ts'],
          },
        },
        exports: {
          './schema.json': './schema/schema.json',
          './index': {
            import: './dist/index.js',
            require: './dist/index.cjs',
          },
        },
      },
      null,
      2,
    );

    expect(writeFileSync).toHaveBeenCalledWith(
      './package.json',
      `${expectedUpdatedPackageJson}\n`,
    );
  });

  it('should update CJS package.json with exports and typesVersions', () => {
    const mockPackageJson = JSON.stringify({});

    (readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

    const mockWriteFileSync = jest.fn();
    (writeFileSync as jest.Mock).mockImplementation(mockWriteFileSync);

    const mockTsupConfig = [
      {
        entry: { index: './src/index.ts' },
        dts: true,
        format: ['esm', 'cjs'],
      },
    ] as Options[];

    generateExports({
      tsupConfig: mockTsupConfig,
      outDir: 'dist',
    });

    const expectedUpdatedPackageJson = JSON.stringify(
      {
        typesVersions: {
          '*': {
            index: ['./dist/index.d.ts'],
          },
        },
        exports: {
          './schema.json': './schema/schema.json',
          './index': {
            import: './dist/index.mjs',
            require: './dist/index.js',
          },
        },
      },
      null,
      2,
    );

    expect(writeFileSync).toHaveBeenCalledWith(
      './package.json',
      `${expectedUpdatedPackageJson}\n`,
    );
  });

  it('should log appropriate messages during execution', () => {
    const consoleLogSpy = jest
      .spyOn(console, 'log')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});
    const mockPackageJson = JSON.stringify({
      type: 'module',
    });

    (readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

    const mockTsupConfig = [
      {
        entry: { index: './src/index.ts' },
        dts: true,
        format: ['esm'],
      },
    ] as Options[];

    generateExports({
      tsupConfig: mockTsupConfig,
      outDir: 'dist',
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '⏶ Generating `package.json` from `tsup.config`',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '  • constructing `exports` and `typesVersions`...',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('  • updating typesVersions...');
    expect(consoleLogSpy).toHaveBeenCalledWith('  • updating exports...');
    expect(consoleLogSpy).toHaveBeenCalledWith('  • writing package.json...');
    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Done');

    consoleLogSpy.mockRestore();
  });
});
