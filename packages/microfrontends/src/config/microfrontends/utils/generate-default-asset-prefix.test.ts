import { generateDefaultAssetPrefixFromName } from './generate-default-asset-prefix';

describe('generateDefaultAssetPrefixFromName', () => {
  it('generates a prefixed asset prefix for a given name', () => {
    expect(generateDefaultAssetPrefixFromName({ name: 'dashboard' })).toBe(
      'vc-ap-dc7161',
    );
  });

  it('generates consistent output for the same input', () => {
    const result1 = generateDefaultAssetPrefixFromName({ name: 'dashboard' });
    const result2 = generateDefaultAssetPrefixFromName({ name: 'dashboard' });
    expect(result1).toBe(result2);
  });

  it('generates different prefixes for different names', () => {
    const result1 = generateDefaultAssetPrefixFromName({ name: 'dashboard' });
    const result2 = generateDefaultAssetPrefixFromName({ name: 'docs' });
    expect(result1).not.toBe(result2);
    expect(result1).toBe('vc-ap-dc7161');
    expect(result2).toBe('vc-ap-e3e2a9');
  });

  it('generates correct prefix for known application names', () => {
    expect(generateDefaultAssetPrefixFromName({ name: 'marketing' })).toBe(
      'vc-ap-c769c2',
    );
    expect(generateDefaultAssetPrefixFromName({ name: 'docs' })).toBe(
      'vc-ap-e3e2a9',
    );
    expect(generateDefaultAssetPrefixFromName({ name: 'vercel-docs' })).toBe(
      'vc-ap-667155',
    );
  });

  it('throws for an empty name', () => {
    expect(() => generateDefaultAssetPrefixFromName({ name: '' })).toThrow(
      'Name is required to generate an asset prefix',
    );
  });
});
