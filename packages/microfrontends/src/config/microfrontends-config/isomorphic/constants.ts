export const DEFAULT_LOCAL_PROXY_PORT = 3024;

/**
 * Environment variable to override the app port for development.
 * Useful when running multiple worktrees simultaneously.
 * Note: Only works when a single application is running locally.
 */
export const MFE_APP_PORT_ENV = 'MFE_APP_PORT';

/**
 * Environment variable to override the local proxy port for development.
 * Useful when running multiple worktrees simultaneously.
 */
export const MFE_LOCAL_PROXY_PORT_ENV = 'MFE_LOCAL_PROXY_PORT';
