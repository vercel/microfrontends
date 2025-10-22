/* @jest-environment node */

import { generatePortFromName } from './generate-port';

describe('generatePortFromName', () => {
  it('generates a port within the default bounds', () => {
    const port = generatePortFromName({ name: 'test' });
    expect(port).toBeGreaterThanOrEqual(3000);
    expect(port).toBeLessThanOrEqual(8000);
  });

  it('generates a port within the provided bounds', () => {
    const port = generatePortFromName({
      name: 'test',
      minPort: 3040,
      maxPort: 3050,
    });
    expect(port).toBeGreaterThanOrEqual(3040);
    expect(port).toBeLessThanOrEqual(3050);
  });

  it('generates the same port for the same name', () => {
    const port1 = generatePortFromName({ name: 'test' });
    const port2 = generatePortFromName({ name: 'test' });
    expect(port1).toBe(port2);
  });

  it('does not generate the same port for different names', () => {
    const port1 = generatePortFromName({ name: 'test' });
    const port2 = generatePortFromName({ name: 'test2' });
    expect(port1).not.toBe(port2);
  });

  it('throws an error if no name is provided', () => {
    expect(() => generatePortFromName({ name: '' })).toThrow();
  });

  it('generates a port for a long name', () => {
    const port = generatePortFromName({
      name: 'this-is-a-very-long-name-that-should-generate-a-port',
    });
    expect(port).toBeGreaterThanOrEqual(3000);
    expect(port).toBeLessThanOrEqual(8000);
  });

  it('generates a port for a name with special characters', () => {
    const port = generatePortFromName({
      name: 'test!@#$%^&*()_+',
    });
    expect(port).toBeGreaterThanOrEqual(3000);
    expect(port).toBeLessThanOrEqual(8000);
  });

  it('generates a port for a name with spaces', () => {
    const port = generatePortFromName({
      name: 'test with spaces',
    });
    expect(port).toBeGreaterThanOrEqual(3000);
    expect(port).toBeLessThanOrEqual(8000);
  });

  it('generates a port for a name with numbers', () => {
    const port = generatePortFromName({
      name: 'test123',
    });
    expect(port).toBeGreaterThanOrEqual(3000);
    expect(port).toBeLessThanOrEqual(8000);
  });

  it('generates 500 ports without collisions', () => {
    expect.assertions(500);
    const ports = new Set();
    for (let i = 0; i < 500; i++) {
      const port = generatePortFromName({ name: `test-${i}` });
      expect(ports.has(port)).toBe(false);
      ports.add(port);
    }
  });
});
