import nextJest from 'next/jest';
import type { Config } from 'jest';

const customConfig: Config = {
  collectCoverageFrom: ['./**/*.{ts,tsx}'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
  moduleNameMapper: {
    // Matches paths in tsconfig.json
    '@/(.*)$': '<rootDir>/$1',
    // mock out CSS modules
    '\\.module.css$': 'identity-obj-proxy',
  },
  testEnvironment: 'jsdom',
  testMatch: ['./**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
};

// eslint-disable-next-line import/no-default-export
export default async (): Promise<Config> => {
  const config = (await nextJest({ dir: './' })(customConfig)()) as Config;
  const finalConfig = {
    ...config,
    // There isn't a way to override this today.
    transformIgnorePatterns: (config.transformIgnorePatterns ?? []).filter(
      (pattern) => !pattern.includes('node_modules'),
    ),
  };
  return finalConfig;
};
