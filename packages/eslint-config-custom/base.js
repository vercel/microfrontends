const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

module.exports = {
  parserOptions: {
    project,
  },
  extends: [
    '@vercel/style-guide/eslint/browser',
    '@vercel/style-guide/eslint/node',
    '@vercel/style-guide/eslint/typescript',
  ].map((config) => require.resolve(config)),

  ignorePatterns: ['node_modules/', 'dist/', 'tsup.config.bundled_*.mjs'],
  rules: {
    'eslint-comments/require-description': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    camelcase: [
      'error',
      {
        allow: ['^UNSAFE_', '^unstable_', '^experimental_'],
        ignoreDestructuring: false,
        properties: 'never',
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'eslint-comments/require-description': 'off',
      },
    },
  ],
};
