import { hashApplicationName } from './hash-application-name';

describe('hashApplicationName', () => {
  it('generates a 6-character hash for application names', () => {
    const hash = hashApplicationName('dashboard');
    expect(hash).toHaveLength(6);
    expect(typeof hash).toBe('string');
    expect(hash).toBe('dc7161');
  });

  it('generates consistent hashes for the same input', () => {
    const hash1 = hashApplicationName('dashboard');
    const hash2 = hashApplicationName('dashboard');
    expect(hash1).toEqual(hash2);
    expect(hash1).toBe('dc7161');
  });

  it('generates different hashes for different inputs', () => {
    const hash1 = hashApplicationName('dashboard');
    const hash2 = hashApplicationName('docs');
    expect(hash1).not.toEqual(hash2);
    expect(hash1).toBe('dc7161');
    expect(hash2).toBe('e3e2a9');
  });

  it('generates alphanumeric hashes', () => {
    expect(hashApplicationName('test-app-name')).toBe('9012ae');
    expect(hashApplicationName('vercel-docs')).toBe('667155');
    expect(hashApplicationName('docs')).toBe('e3e2a9');
    expect(hashApplicationName('marketing')).toBe('c769c2');
    expect(hashApplicationName('nyc-sfo')).toBe('f86c94');
    expect(hashApplicationName('peanut-butter')).toBe('5c3821');
    expect(hashApplicationName('app-name123')).toBe('71ad28');
    expect(hashApplicationName('foo-bar-baz')).toBe('4c4379');
  });

  it('throws error for empty application name', () => {
    expect(() => hashApplicationName('')).toThrow(
      'Application name is required to generate hash',
    );
  });

  it('handles special characters in application names', () => {
    const hash = hashApplicationName('my-app@2024');
    expect(hash).toHaveLength(6);
    expect(typeof hash).toBe('string');
    expect(hash).toBe('241983');
  });
});
