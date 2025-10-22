#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const PATH_TO_DIST = path.resolve(__dirname, '../dist');

// Define the path to the CLI file
const cliPath = path.resolve(__dirname, PATH_TO_DIST, 'bin/cli.cjs');

try {
  const result = spawnSync('node', [cliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
  });

  process.exit(result.status);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Error loading microfrontends CLI, please re-install', error);
  process.exit(1);
}
