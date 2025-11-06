/* eslint-disable no-console */

function debug(...args: unknown[]): void {
  if (process.env.MFE_DEBUG) {
    console.log(...args);
  }
}

function info(...args: unknown[]): void {
  console.log(...args);
}

function warn(...args: unknown[]): void {
  console.warn(...args);
}

function error(...args: unknown[]): void {
  console.error(...args);
}

export const logger = {
  debug,
  info,
  warn,
  error,
};
