#!/usr/bin/env node
import { spawn } from 'node:child_process';

const delay = parseInt(process.env.MFE_STARTUP_DELAY || '0', 10) * 1000;

if (delay > 0) {
  // eslint-disable-next-line no-console
  console.log(`⏳ Delaying startup by ${delay / 1000} seconds...`);
}

setTimeout(() => {
  if (delay > 0) {
    // eslint-disable-next-line no-console
    console.log('🚀 Starting Next.js dev server...');
  }
  const child = spawn(
    'next',
    ['dev', '--turbo', '--port', process.env.PORT || '3000'],
    {
      stdio: 'inherit',
      shell: true,
    },
  );

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}, delay);
